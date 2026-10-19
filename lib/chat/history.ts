import type { ChatMessage } from "@/types/advisor";
import type { AdvisorRequest, WireMessage } from "@/types/chat";
import { LIMITS, encodedBytes } from "./limits";
import { ChatError } from "./errors";
import { validateBusinessBrief } from "./brief";
export function buildRequestHistory(
  messages: ChatMessage[],
  currentUser: ChatMessage,
  envelope: Omit<AdvisorRequest, "messages">,
): WireMessage[] {
  const pairs: WireMessage[][] = [];
  for (let i = 0; i < messages.length - 1; i++) {
    const user = messages[i],
      assistant = messages[i + 1];
    if (
      user.id === currentUser.id ||
      user.welcome ||
      user.role !== "user" ||
      assistant.role !== "assistant" ||
      assistant.streaming ||
      !assistant.content.trim() ||
      (assistant.status && assistant.status !== "complete")
    )
      continue;
    if (
      user.content.length > LIMITS.userChars ||
      assistant.content.length > LIMITS.assistantChars
    )
      continue;
    pairs.push([
      { role: "user", content: user.content.trim() },
      { role: "assistant", content: assistant.content.trim() },
    ]);
    i++;
  }
  while (pairs.length > 11) pairs.shift();
  let history: WireMessage[] = [];
  do {
    history = [
      ...pairs.flat(),
      { role: "user", content: currentUser.content.trim() },
    ];
    if (
      history.reduce((n, m) => n + m.content.length, 0) <=
        LIMITS.historyChars &&
      encodedBytes({ ...envelope, messages: history }) <= LIMITS.requestBytes
    )
      break;
    if (!pairs.length) throw new ChatError("payload_too_large", 413);
    pairs.shift();
  } while (true);
  return history;
}
export function validateAdvisorRequest(value: unknown): AdvisorRequest {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new ChatError("invalid_request");
  const v = value as AdvisorRequest;
  if (
    v.version !== 1 ||
    !["concise", "detail", "roadmap"].includes(v.mode) ||
    !["auto", "quick", "deep"].includes(v.reasoning)
  )
    throw new ChatError("invalid_request");
  for (const key of ["conversationId", "turnId", "attemptId"] as const)
    if (typeof v[key] !== "string" || !/^[a-zA-Z0-9_-]{1,80}$/.test(v[key]))
      throw new ChatError("invalid_request");
  if (
    !Array.isArray(v.messages) ||
    !v.messages.length ||
    v.messages.length > LIMITS.historyMessages
  )
    throw new ChatError("invalid_request");
  const messages = v.messages.map((m, i) => {
    if (
      !m ||
      !["user", "assistant"].includes(m.role) ||
      typeof m.content !== "string" ||
      !m.content.trim() ||
      m.content.length >
        (m.role === "user" ? LIMITS.userChars : LIMITS.assistantChars)
    )
      throw new ChatError("invalid_request");
    if (m.role !== (i % 2 === 0 ? "user" : "assistant"))
      throw new ChatError("invalid_request");
    return { role: m.role, content: m.content.trim() };
  });
  if (
    messages.at(-1)?.role !== "user" ||
    messages.reduce((n, m) => n + m.content.length, 0) > LIMITS.historyChars
  )
    throw new ChatError("invalid_request");
  const result: AdvisorRequest = {
    version: 1,
    conversationId: v.conversationId,
    turnId: v.turnId,
    attemptId: v.attemptId,
    mode: v.mode,
    reasoning: v.reasoning,
    messages,
    profile: validateBusinessBrief(v.profile || {}),
  };
  if (encodedBytes(result) > LIMITS.requestBytes)
    throw new ChatError("payload_too_large", 413);
  return result;
}
export async function readBoundedJson(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new ChatError("invalid_request");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > LIMITS.requestBytes) {
        await reader.cancel();
        throw new ChatError("payload_too_large", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const merged = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(merged));
  } catch {
    throw new ChatError("invalid_request");
  }
}
