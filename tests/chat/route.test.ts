import { afterEach, expect, it, vi } from "vitest";
import { POST } from "@/app/api/advisor/chat/route";
import { NextRequest } from "next/server";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
it("rejects oversized bodies without trusting Content-Length", async () => {
  const request = new NextRequest("http://localhost/api/advisor/chat", {
    method: "POST",
    body: JSON.stringify({ text: "x".repeat(140000) }),
    headers: { "Content-Type": "application/json" },
  });
  const response = await POST(request);
  expect(response.status).toBe(413);
});
it("rejects cross-origin requests before contacting the model", async () => {
  const response = await POST(
    new NextRequest("http://localhost/api/advisor/chat", {
      method: "POST",
      headers: {
        origin: "https://other.example",
        "Content-Type": "application/json",
      },
      body: "{}",
    }),
  );
  expect(response.status).toBe(403);
});
it("streams in production with only the NVIDIA key configured", async () => {
  vi.stubEnv("NVIDIA_API_KEY", "test-key");
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("NETLIFY", "");
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  vi.stubEnv("ADVISOR_SESSION_SECRET", "");
  vi.stubGlobal(
    "fetch",
    async () =>
      new Response(
        'data: {"choices":[{"delta":{"content":"Complete result"},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n',
      ),
  );
  const response = await POST(
    new NextRequest("http://localhost/api/advisor/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        version: 1,
        conversationId: "c",
        turnId: "t",
        attemptId: crypto.randomUUID(),
        mode: "concise",
        reasoning: "quick",
        messages: [{ role: "user", content: "Hello" }],
      }),
    }),
  );
  expect(response.status).toBe(200);
  expect(response.headers.get("set-cookie")).toBeNull();
  expect(response.headers.get("cache-control")).toContain("no-store");
  const body = await response.text();
  expect(body).toContain('"type":"finish"');
  expect(body).toContain("Complete result");
  expect(body).not.toContain("test-key");
});
