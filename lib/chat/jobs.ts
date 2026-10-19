import type { AdvisorRequest, ChatEvent, MessageStatus } from "@/types/chat";
import { redisStore, type KeyValueStore } from "./redis";
import { openNvidiaStream } from "./provider";
import { settleGeneration } from "./admission";
import { ChatError } from "./errors";
import { workerToken } from "./session";
import { recordChatMetric } from "./telemetry";
export type GenerationJob = {
  id: string;
  owner: string;
  requestId: string;
  reservationId: string;
  input: AdvisorRequest;
  phase: "thinking" | "typing";
  status: MessageStatus;
  content: string;
  createdAt: number;
  updatedAt: number;
  error?: string;
  generatedTokens?: number;
};
const key = (id: string) => `{bizguide}:job:${id}`;
export async function readJob(
  id: string,
  store: KeyValueStore = redisStore(),
): Promise<GenerationJob | null> {
  if (!/^[a-f0-9-]{36}$/.test(id)) return null;
  const data = await store.command<string | null>(["GET", key(id)]);
  if (!data) return null;
  try {
    return JSON.parse(data) as GenerationJob;
  } catch {
    return null;
  }
}
export function publicJobSnapshot(job: GenerationJob) {
  return {
    id: job.id,
    requestId: job.requestId,
    attemptId: job.input.attemptId,
    status: job.status,
    phase: job.phase,
    content: job.content,
    error: job.error,
    updatedAt: job.updatedAt,
  };
}
async function saveJob(job: GenerationJob, store: KeyValueStore) {
  job.updatedAt = Date.now();
  await store.command(["SET", key(job.id), JSON.stringify(job), "EX", 3600]);
}
export async function createGenerationJob(
  input: AdvisorRequest,
  owner: string,
  requestId: string,
  reservationId: string,
  store: KeyValueStore = redisStore(),
) {
  const id = crypto.randomUUID(),
    now = Date.now();
  const job: GenerationJob = {
    id,
    owner,
    requestId,
    reservationId,
    input,
    createdAt: now,
    updatedAt: now,
    phase: "thinking",
    status: "pending",
    content: "",
  };
  await saveJob(job, store);
  const base = process.env.DEPLOY_PRIME_URL || process.env.URL;
  if (!base?.startsWith("https://")) throw new ChatError("not_configured", 503);
  const response = await fetch(
    `${base}/.netlify/functions/advisor-generate-background`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${workerToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
      signal: AbortSignal.timeout(8000),
    },
  );
  if (!response.ok) throw new ChatError("provider_unavailable", 502);
  return id;
}
export async function cancelGenerationJob(
  id: string,
  store: KeyValueStore = redisStore(),
) {
  await store.command(["SET", `${key(id)}:cancel`, "1", "EX", 3600]);
}
export async function runGenerationJob(
  id: string,
  store: KeyValueStore = redisStore(),
) {
  const job = await readJob(id, store);
  if (!job || !["pending", "streaming"].includes(job.status)) return;
  const claimed = await store.command<string | null>([
    "SET",
    `${key(id)}:claim`,
    "1",
    "NX",
    "EX",
    900,
  ]);
  if (!claimed) return;
  const controller = new AbortController();
  let lastSave = 0,
    firstContentMs: number | undefined,
    finished = false,
    polling = false;
  const poll = setInterval(async () => {
    if (polling) return;
    polling = true;
    try {
      if (await store.command(["GET", `${key(id)}:cancel`]))
        controller.abort(new ChatError("cancelled", 499));
    } catch {
      controller.abort(new ChatError("provider_unavailable", 502));
    } finally {
      polling = false;
    }
  }, 1000);
  try {
    if (await store.command(["GET", `${key(id)}:cancel`])) controller.abort();
    const opened = await openNvidiaStream(job.input, {
      requestId: job.requestId,
      signal: controller.signal,
    });
    for await (const event of opened.events) {
      if (event.type === "delta") {
        job.content = (job.content + event.text).slice(0, 24000);
        job.phase = "typing";
        job.status = "streaming";
        firstContentMs ??= Date.now() - job.createdAt;
      } else if (event.type === "progress") job.phase = event.phase;
      else if (event.type === "finish") {
        job.status = event.reason === "length" ? "truncated" : "complete";
        job.generatedTokens = event.generatedTokens;
        finished = true;
      } else if (event.type === "error") {
        job.status = job.content ? "interrupted" : "failed";
        job.error = event.code;
        finished = true;
      }
      if (Date.now() - lastSave >= 500 || finished) {
        await saveJob(job, store);
        lastSave = Date.now();
      }
    }
    if (!finished) {
      job.status = job.content ? "interrupted" : "failed";
      job.error = "protocol_error";
    }
  } catch (error) {
    job.status = job.content ? "interrupted" : "failed";
    job.error =
      error instanceof ChatError ? error.code : "provider_unavailable";
  } finally {
    clearInterval(poll);
    await saveJob(job, store).catch(() => undefined);
    await settleGeneration(job.reservationId, {
      outcome: job.status,
      generatedTokens: job.generatedTokens,
    }).catch(() => undefined);
    recordChatMetric({
      requestId: job.requestId,
      mode: job.input.mode,
      model: process.env.NVIDIA_MODEL || "nvidia/nemotron-3-ultra-550b-a55b",
      outcome: job.status,
      durationMs: Date.now() - job.createdAt,
      firstContentMs,
      generatedTokens: job.generatedTokens,
      code: job.error,
    });
  }
}
export function snapshotEvent(
  snapshot: ReturnType<typeof publicJobSnapshot>,
  previousLength: number,
): ChatEvent[] {
  const ids = { requestId: snapshot.requestId, attemptId: snapshot.attemptId };
  const result: ChatEvent[] = [
    { type: "progress", phase: snapshot.phase, ...ids },
  ];
  if (snapshot.content.length > previousLength)
    result.push({
      type: "delta",
      text: snapshot.content.slice(previousLength),
      ...ids,
    });
  if (snapshot.status === "complete" || snapshot.status === "truncated")
    result.push({
      type: "finish",
      reason: snapshot.status === "truncated" ? "length" : "stop",
      ...ids,
    });
  else if (snapshot.status === "failed" || snapshot.status === "interrupted")
    result.push({
      type: "error",
      code:
        snapshot.error === "cancelled"
          ? "cancelled"
          : snapshot.error === "provider_timeout"
            ? "provider_timeout"
            : "provider_unavailable",
      retryable: true,
      ...ids,
    });
  return result;
}
