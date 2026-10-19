import { expect, it } from "vitest";
import {
  parseSavedConversation,
  validateStoredNotes,
  writeStorage,
} from "@/lib/chat/storage";
it("restores in-flight content as interrupted and validates stored notes", () => {
  const saved = parseSavedConversation({
    schemaVersion: 1,
    id: "chat",
    title: "Idea",
    updatedAt: 1,
    draft: "My draft",
    profile: {},
    messages: [
      {
        id: "m",
        turnId: "t",
        role: "assistant",
        content: "Partial text",
        createdAt: 1,
        status: "streaming",
      },
    ],
    completedSteps: { "m:pilot": true },
    locale: "bn",
  });
  expect(saved?.messages[0].status).toBe("interrupted");
  expect(saved?.draft).toBe("My draft");
  expect(saved?.completedSteps["m:pilot"]).toBe(true);
  expect(
    validateStoredNotes([
      { id: "n", text: "Keep this", createdAt: 1 },
      { text: "No ID" },
    ]),
  ).toHaveLength(1);
});
it("reports unavailable/quota storage without throwing or pretending to save", () => {
  expect(
    writeStorage(
      {
        setItem() {
          throw new DOMException("Full", "QuotaExceededError");
        },
      },
      "chat",
      {},
    ),
  ).toEqual({ ok: false, reason: "quota" });
  expect(writeStorage(null, "chat", {})).toEqual({
    ok: false,
    reason: "unavailable",
  });
  expect(parseSavedConversation({ schemaVersion: 999 })).toBeNull();
});
