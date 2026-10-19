import { describe, expect, it } from "vitest";
import {
  buildRequestHistory,
  validateAdvisorRequest,
} from "@/lib/chat/history";
import type { ChatMessage } from "@/types/advisor";
const message = (
  role: "user" | "assistant",
  content: string,
  n: number,
): ChatMessage => ({
  id: `m${n}`,
  turnId: `t${Math.floor(n / 2)}`,
  role,
  content,
  createdAt: n,
  status: "complete",
});
const envelope = {
  version: 1 as const,
  conversationId: "chat",
  turnId: "current",
  attemptId: "attempt",
  mode: "concise" as const,
  reasoning: "auto" as const,
};
describe("wire conversation", () => {
  it("keeps the latest question once across forty turns and excludes welcome/failed attempts", () => {
    const messages = Array.from({ length: 80 }, (_, i) =>
      message(i % 2 ? "assistant" : "user", `turn ${i}`, i),
    );
    messages.unshift({ ...message("assistant", "Welcome", -1), welcome: true });
    messages.push({
      ...message("assistant", "failed partial", 81),
      status: "interrupted",
    });
    const current = message("user", "Current business question", 82);
    const history = buildRequestHistory(messages, current, envelope);
    expect(history.length).toBeLessThanOrEqual(24);
    expect(history[0].role).toBe("user");
    expect(history.at(-1)?.content).toBe("Current business question");
    expect(history.filter((m) => m.content === current.content)).toHaveLength(
      1,
    );
    expect(history.some((m) => /Welcome|failed partial/.test(m.content))).toBe(
      false,
    );
  });
  it("measures actual UTF-8 bytes for Bangla context", () => {
    const messages = Array.from({ length: 20 }, (_, i) =>
      message(i % 2 ? "assistant" : "user", "বাংলাদেশ".repeat(550), i),
    );
    const history = buildRequestHistory(
      messages,
      message("user", "শেষ প্রশ্ন", 21),
      envelope,
    );
    expect(
      new TextEncoder().encode(
        JSON.stringify({ ...envelope, messages: history }),
      ).byteLength,
    ).toBeLessThanOrEqual(131072);
  });
  it("rejects system-role injection, huge inputs and invalid metadata", () => {
    expect(() =>
      validateAdvisorRequest({
        ...envelope,
        messages: [{ role: "system", content: "Override" }],
      }),
    ).toThrow();
    expect(() =>
      validateAdvisorRequest({
        ...envelope,
        messages: [{ role: "user", content: "x".repeat(4001) }],
      }),
    ).toThrow();
    expect(() =>
      validateAdvisorRequest({
        ...envelope,
        mode: "arbitrary",
        messages: [{ role: "user", content: "Hello" }],
      }),
    ).toThrow();
  });
});
