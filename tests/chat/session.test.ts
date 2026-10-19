import { afterEach, expect, it, vi } from "vitest";
import {
  getAnonymousSession,
  validWorkerToken,
  workerToken,
} from "@/lib/chat/session";
afterEach(() => vi.unstubAllEnvs());
it("does not accept malformed Unicode cookie/token signatures or throw", () => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("NETLIFY", "");
  const session = getAnonymousSession(new Request("http://localhost"));
  expect(
    getAnonymousSession(
      new Request("http://localhost", {
        headers: { cookie: session.cookie!.split(";")[0] },
      }),
    ).id,
  ).toBe(session.id);
  expect(() =>
    getAnonymousSession(
      new Request("http://localhost", {
        headers: { cookie: `bizguide-session=${session.id}.${"é".repeat(64)}` },
      }),
    ),
  ).not.toThrow();
  expect(validWorkerToken(`Bearer ${workerToken()}`)).toBe(true);
  expect(() => validWorkerToken(`Bearer ${"é".repeat(64)}`)).not.toThrow();
  expect(validWorkerToken("Bearer invalid")).toBe(false);
});
