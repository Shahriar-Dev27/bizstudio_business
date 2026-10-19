import { expect, it } from "vitest";
import {
  saveDevicePlan,
  listDevicePlans,
  exportPlanMarkdown,
} from "@/lib/chat/plan-library";
import { createConversation } from "@/lib/chat/reducer";
const storage = () => {
  const values = new Map<string, string>();
  return {
    getItem: (k: string) => values.get(k) || null,
    setItem: (k: string, v: string) => {
      values.set(k, v);
    },
  };
};
it("saves and resumes plans and detects stale cross-tab writes", () => {
  const store = storage(),
    plan = { ...createConversation(), draft: "My saved idea" };
  const result = saveDevicePlan(plan, store);
  expect(result.ok).toBe(true);
  const saved = listDevicePlans(store)[0];
  expect(saved.draft).toBe("My saved idea");
  expect(saveDevicePlan({ ...plan, draft: "Stale" }, store)).toMatchObject({
    ok: false,
    reason: "conflict",
  });
  expect(saveDevicePlan({ ...saved, draft: "Updated" }, store).ok).toBe(true);
});
it("exports provenance and partial states without inventing verified facts", () => {
  const plan = createConversation();
  plan.messages.push({
    id: "m",
    turnId: "t",
    role: "assistant",
    content: "Illustrative estimate",
    status: "interrupted",
    createdAt: 1,
  });
  const text = exportPlanMarkdown(plan, [
    {
      id: "n",
      text: "Interview five people",
      sourceMessageId: "m",
      conversationId: plan.id,
      createdAt: 1,
    },
  ]);
  expect(text).toContain("interrupted");
  expect(text).toContain("Interview five people");
  expect(text).toContain("Illustrative estimate");
});
