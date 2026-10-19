import { NextRequest, NextResponse } from "next/server";
import { readBoundedJson, validateAdvisorRequest } from "@/lib/chat/history";
import { openNvidiaStream, buildProviderBody } from "@/lib/chat/provider";
import { reserveGeneration, settleGeneration } from "@/lib/chat/admission";
import { getAnonymousSession, hashIp } from "@/lib/chat/session";
import { createGenerationJob } from "@/lib/chat/jobs";
import { ChatError } from "@/lib/chat/errors";
import { encodeChatEvent } from "@/lib/chat/sse";
import { recordChatMetric } from "@/lib/chat/telemetry";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID(),
    started = Date.now();
  let reservation: string | undefined;
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin)
      return NextResponse.json(
        {
          error: "Please send this request from the advisor website.",
          code: "invalid_request",
          requestId,
        },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    const input = validateAdvisorRequest(await readBoundedJson(request));
    if (!process.env.NVIDIA_API_KEY?.trim())
      throw new ChatError("not_configured", 503);
    const session = getAnonymousSession(request),
      providerBody = buildProviderBody(input);
    reservation = await reserveGeneration({
      sessionId: session.id,
      ipKey: hashIp(request),
      attemptId: input.attemptId,
      maxOutputTokens: providerBody.max_tokens,
    });
    const headers: Record<string, string> = {
      "Cache-Control": "no-store, no-transform",
      "X-Request-ID": requestId,
    };
    if (session.cookie) headers["Set-Cookie"] = session.cookie;
    if (process.env.NETLIFY === "true") {
      const id = await createGenerationJob(
        input,
        session.id,
        requestId,
        reservation,
      );
      reservation = undefined;
      return NextResponse.json(
        { jobId: id, requestId, attemptId: input.attemptId },
        { status: 202, headers },
      );
    }
    const controller = new AbortController();
    const abort = () => controller.abort();
    request.signal.addEventListener("abort", abort, { once: true });
    let opened;
    try {
      opened = await openNvidiaStream(input, {
        requestId,
        signal: controller.signal,
      });
    } catch (error) {
      request.signal.removeEventListener("abort", abort);
      throw error;
    }
    const id = reservation;
    reservation = undefined;
    let firstContentMs: number | undefined;
    const stream = new ReadableStream<Uint8Array>({
      async start(output) {
        let outcome = "interrupted",
          generatedTokens: number | undefined,
          code: string | undefined;
        try {
          for await (const event of opened.events) {
            if (event.type === "delta") firstContentMs ??= Date.now() - started;
            if (event.type === "finish") {
              outcome = event.reason === "length" ? "truncated" : "complete";
              generatedTokens = event.generatedTokens;
            }
            if (event.type === "error") {
              outcome = "interrupted";
              code = event.code;
            }
            if (!controller.signal.aborted)
              output.enqueue(encodeChatEvent(event));
          }
          if (!controller.signal.aborted) output.close();
        } catch {
          try {
            output.error(new Error("Reply interrupted"));
          } catch {
            /* Reader already cancelled. */
          }
        } finally {
          request.signal.removeEventListener("abort", abort);
          await opened.close();
          await settleGeneration(id!, { outcome, generatedTokens }).catch(
            () => undefined,
          );
          recordChatMetric({
            requestId,
            model: providerBody.model,
            mode: input.mode,
            outcome,
            durationMs: Date.now() - started,
            firstContentMs,
            generatedTokens,
            code,
          });
        }
      },
      async cancel() {
        controller.abort();
        await opened.close();
      },
    });
    return new Response(stream, {
      headers: {
        ...headers,
        "Content-Type": "text/event-stream; charset=utf-8",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    if (reservation)
      await settleGeneration(reservation, { outcome: "failed" }).catch(
        () => undefined,
      );
    const failure =
      error instanceof ChatError
        ? error
        : new ChatError("provider_unavailable", 502);
    return NextResponse.json(
      {
        error: failure.message,
        code: failure.code,
        requestId,
        retryable: failure.status >= 500 || failure.status === 429,
        retryAfterSeconds: failure.retryAfterSeconds,
      },
      {
        status: failure.status,
        headers: {
          "Cache-Control": "no-store",
          ...(failure.retryAfterSeconds
            ? { "Retry-After": String(failure.retryAfterSeconds) }
            : {}),
        },
      },
    );
  }
}
