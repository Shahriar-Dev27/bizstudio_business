import { expect, it } from "vitest";
import {
  MemoryAdmissionStore,
  reserveGeneration,
  settleGeneration,
} from "@/lib/chat/admission";
it("admits only one concurrent generation per session and releases exactly once", async () => {
  const store = new MemoryAdmissionStore();
  const input = {
    sessionId: "session",
    ipKey: "ip",
    attemptId: "a",
    maxOutputTokens: 900,
  };
  const outcomes = await Promise.allSettled([
    reserveGeneration(input, store),
    reserveGeneration({ ...input, attemptId: "b" }, store),
  ]);
  expect(outcomes.filter((o) => o.status === "fulfilled")).toHaveLength(1);
  const accepted = outcomes.find((o) => o.status === "fulfilled")!;
  if (accepted.status !== "fulfilled") throw Error();
  await settleGeneration(
    accepted.value,
    { outcome: "complete", generatedTokens: 20 },
    store,
  );
  await settleGeneration(
    accepted.value,
    { outcome: "complete", generatedTokens: 20 },
    store,
  );
  await expect(
    reserveGeneration({ ...input, attemptId: "c" }, store),
  ).resolves.toEqual(expect.any(String));
});
it("enforces the shared global daily budget, not only browser limits", async () => {
  const store = new MemoryAdmissionStore();
  await expect(
    reserveGeneration(
      { sessionId: "s", ipKey: "ip", attemptId: "a", maxOutputTokens: 100001 },
      store,
    ),
  ).rejects.toMatchObject({ code: "budget_exhausted" });
});
