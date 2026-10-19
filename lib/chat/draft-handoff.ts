import { DRAFT_KEY, getStorage, readStorage, writeStorage } from "./storage";
export function prepareDraftHandoff(text: string) {
  const value = text.trim();
  if (!value || value.length > 500) return { ok: false };
  return writeStorage(getStorage("sessionStorage"), DRAFT_KEY, {
    text: value,
    createdAt: Date.now(),
  });
}
export function takeDraftHandoff(): string {
  const store = getStorage("sessionStorage"),
    value = readStorage(store, DRAFT_KEY) as {
      text?: unknown;
      createdAt?: unknown;
    } | null;
  try {
    store?.removeItem(DRAFT_KEY);
  } catch {
    /* An unavailable store has no usable handoff. */
  }
  return value &&
    typeof value.text === "string" &&
    value.text.length <= 500 &&
    typeof value.createdAt === "number" &&
    Date.now() - value.createdAt < 600000
    ? value.text
    : "";
}
