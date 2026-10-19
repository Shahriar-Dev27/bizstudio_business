import type { ChatMessage, PinnedNote } from "@/types/advisor";
import type { SavedConversation, MessageStatus } from "@/types/chat";
import { validateBusinessBrief } from "./brief";
export const SESSION_KEY = "bizguide-chat-session-v1",
  LIBRARY_KEY = "bizguide-device-plans-v1",
  PIN_KEY = "bizguide-pinned-notes-v1",
  DRAFT_KEY = "bizguide-draft-handoff-v1";
export type StorageResult = {
  ok: boolean;
  reason?: "unavailable" | "quota" | "invalid" | "conflict" | "limit";
};
export function writeStorage(
  storage: Pick<Storage, "setItem"> | null,
  key: string,
  value: unknown,
): StorageResult {
  if (!storage) return { ok: false, reason: "unavailable" };
  try {
    storage.setItem(key, JSON.stringify(value));
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason:
        error instanceof DOMException && error.name === "QuotaExceededError"
          ? "quota"
          : "unavailable",
    };
  }
}
export function getStorage(
  kind: "sessionStorage" | "localStorage",
): Storage | null {
  try {
    return typeof window !== "undefined" ? window[kind] : null;
  } catch {
    return null;
  }
}
export function readStorage(
  storage: Pick<Storage, "getItem"> | null,
  key: string,
): unknown {
  try {
    return JSON.parse(storage?.getItem(key) || "null");
  } catch {
    return null;
  }
}
export function parseSavedConversation(
  value: unknown,
): SavedConversation | null {
  if (!value || typeof value !== "object") return null;
  const v = value as SavedConversation;
  if (
    v.schemaVersion !== 1 ||
    typeof v.id !== "string" ||
    v.id.length > 80 ||
    !Array.isArray(v.messages) ||
    v.messages.length > 200 ||
    typeof v.draft !== "string" ||
    v.draft.length > 4000
  )
    return null;
  const messages: ChatMessage[] = [],
    statuses: MessageStatus[] = [
      "pending",
      "streaming",
      "complete",
      "interrupted",
      "failed",
      "truncated",
    ];
  for (const m of v.messages) {
    if (
      !m ||
      typeof m.id !== "string" ||
      !["user", "assistant"].includes(m.role) ||
      typeof m.content !== "string" ||
      m.content.length > 24000 ||
      !Number.isFinite(m.createdAt)
    )
      return null;
    const status =
      m.status && statuses.includes(m.status)
        ? m.status
        : m.streaming
          ? "interrupted"
          : "complete";
    messages.push({
      ...m,
      status:
        status === "streaming" || status === "pending" ? "interrupted" : status,
      streaming: false,
      attempts: Array.isArray(m.attempts)
        ? m.attempts
            .filter(
              (a) =>
                a &&
                typeof a.content === "string" &&
                a.content.length <= 24000 &&
                typeof a.attemptId === "string" &&
                statuses.includes(a.status),
            )
            .slice(-5)
        : [],
    });
  }
  let profile;
  try {
    profile = validateBusinessBrief(v.profile || {});
  } catch {
    return null;
  }
  const completedSteps: Record<string, boolean> = {};
  if (v.completedSteps && typeof v.completedSteps === "object")
    for (const [key, done] of Object.entries(v.completedSteps).slice(0, 800))
      if (
        key.length <= 150 &&
        done === true &&
        !["__proto__", "constructor", "prototype"].includes(key)
      )
        completedSteps[key] = true;
  return {
    schemaVersion: 1,
    id: v.id,
    title:
      typeof v.title === "string" ? v.title.slice(0, 100) : "Business plan",
    updatedAt: Number.isFinite(v.updatedAt) ? v.updatedAt : Date.now(),
    messages,
    draft: v.draft,
    profile,
    completedSteps,
    locale: v.locale === "bn" ? "bn" : "en",
    revision: typeof v.revision === "string" ? v.revision : undefined,
  };
}
export function validateStoredNotes(value: unknown): PinnedNote[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (n): n is PinnedNote =>
        !!n &&
        typeof n.id === "string" &&
        n.id.length <= 100 &&
        typeof n.text === "string" &&
        !!n.text.trim() &&
        n.text.length <= 500 &&
        Number.isFinite(n.createdAt),
    )
    .map((n) => ({
      id: n.id,
      text: n.text,
      createdAt: n.createdAt,
      sourceMessageId:
        typeof n.sourceMessageId === "string" ? n.sourceMessageId : undefined,
      conversationId:
        typeof n.conversationId === "string" ? n.conversationId : undefined,
      kind: ["selection", "step", "personal"].includes(n.kind || "")
        ? n.kind
        : n.sourceMessageId
          ? "selection"
          : "personal",
    }));
}
export const loadSession = () =>
  parseSavedConversation(
    readStorage(getStorage("sessionStorage"), SESSION_KEY),
  );
export const saveSession = (value: SavedConversation) =>
  writeStorage(getStorage("sessionStorage"), SESSION_KEY, value);
