import { expect, it } from "vitest";
import { chatReducer, createConversation } from "@/lib/chat/reducer";
import type { ChatState } from "@/types/chat";
import type { ChatMessage } from "@/types/advisor";
function running() {
  let s: ChatState = {
    ...createConversation(),
    phase: "idle",
    activeAttemptId: null,
    error: "",
  };
  const user: ChatMessage = {
    id: "u",
    turnId: "t",
    role: "user",
    content: "Test demand",
    createdAt: 1,
    status: "complete",
  };
  const assistant: ChatMessage = {
    id: "a",
    turnId: "t",
    attemptId: "one",
    role: "assistant",
    content: "",
    createdAt: 2,
    status: "pending",
  };
  s = chatReducer(s, { type: "start", user, assistant, retry: false });
  s = chatReducer(s, {
    type: "event",
    conversationId: s.id,
    event: {
      type: "delta",
      requestId: "r",
      attemptId: "one",
      text: "Useful partial advice",
    },
  });
  return { s, user, assistant };
}
it("retains partial output on Stop and does not append another user on Retry", () => {
  const { s, user, assistant } = running();
  const stopped = chatReducer(s, {
    type: "end",
    conversationId: s.id,
    attemptId: "one",
    status: "interrupted",
  });
  expect(stopped.messages.at(-1)?.content).toBe("Useful partial advice");
  expect(stopped.messages.at(-1)?.status).toBe("interrupted");
  const retried = chatReducer(stopped, {
    type: "start",
    user,
    assistant: { ...assistant, attemptId: "two" },
    retry: true,
  });
  expect(retried.messages.filter((m) => m.role === "user")).toHaveLength(1);
  expect(retried.messages.at(-1)?.attempts?.[0].content).toBe(
    "Useful partial advice",
  );
});
it("ignores previous conversation/attempt callbacks and marks token caps visibly", () => {
  const { s } = running();
  const reset = chatReducer(s, {
    type: "replace",
    value: createConversation(),
  });
  expect(
    chatReducer(reset, {
      type: "end",
      conversationId: s.id,
      attemptId: "one",
      status: "failed",
      error: "Old error",
    }).error,
  ).toBe("");
  expect(
    chatReducer(s, {
      type: "event",
      conversationId: s.id,
      event: { type: "delta", requestId: "r", attemptId: "old", text: "wrong" },
    }).messages.at(-1)?.content,
  ).toBe("Useful partial advice");
  expect(
    chatReducer(s, {
      type: "event",
      conversationId: s.id,
      event: {
        type: "finish",
        requestId: "r",
        attemptId: "one",
        reason: "length",
      },
    }).messages.at(-1)?.status,
  ).toBe("truncated");
});
