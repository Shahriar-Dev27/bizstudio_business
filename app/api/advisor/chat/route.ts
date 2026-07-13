import { NextRequest, NextResponse } from "next/server";
import { BANGLADESH_ADVISOR_PROMPT } from "@/lib/advisor-prompt";

export const runtime = "nodejs";

type IncomingMessage = { role: "user" | "assistant"; content: string };

function validMessages(value: unknown): value is IncomingMessage[] {
  return Array.isArray(value) && value.length > 0 && value.length <= 30 && value.every((message) => {
    if (!message || typeof message !== "object") return false;
    const candidate = message as Partial<IncomingMessage>;
    return (candidate.role === "user" || candidate.role === "assistant") && typeof candidate.content === "string" && candidate.content.trim().length > 0 && candidate.content.length <= 12000;
  });
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  const model = process.env.OPENROUTER_MODEL?.trim() || "openrouter/free";

  if (!apiKey) {
    return NextResponse.json({ error: "OpenRouter is not configured on the server." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The request body must be valid JSON." }, { status: 400 });
  }

  const messages = (body as { messages?: unknown })?.messages;
  if (!validMessages(messages)) {
    return NextResponse.json({ error: "Send between 1 and 30 valid conversation messages." }, { status: 400 });
  }

  try {
    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "BizGuide AI",
      },
      body: JSON.stringify({
        model,
        stream: true,
        temperature: 0.68,
        max_tokens: 1800,
        messages: [
          { role: "system", content: BANGLADESH_ADVISOR_PROMPT },
          ...messages.slice(-24).map((message) => ({ role: message.role, content: message.content.trim() })),
        ],
      }),
      signal: AbortSignal.timeout(90000),
    });

    if (!upstream.ok || !upstream.body) {
      const errorBody = await upstream.text();
      let message = "The advisor provider could not complete this request.";
      try {
        const parsed = JSON.parse(errorBody) as { error?: { message?: string } | string };
        message = typeof parsed.error === "string" ? parsed.error : parsed.error?.message || message;
      } catch { /* Keep the safe fallback instead of exposing raw provider output. */ }
      return NextResponse.json({ error: message }, { status: upstream.status || 502 });
    }

    // ponytail: proxy OpenRouter's native SSE stream; transform it here only if server-side moderation or usage metering is added.
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    return NextResponse.json({ error: timedOut ? "The advisor took too long to respond. Please try again." : "Unable to reach the advisor service." }, { status: timedOut ? 504 : 502 });
  }
}
