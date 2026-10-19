import { afterEach, expect, it, vi } from "vitest";
import { openNvidiaStream, buildProviderBody } from "@/lib/chat/provider";
import type { AdvisorRequest } from "@/types/chat";
const request: AdvisorRequest = {
  version: 1,
  conversationId: "c",
  turnId: "t",
  attemptId: "a",
  mode: "concise",
  reasoning: "quick",
  messages: [{ role: "user", content: "Hello" }],
};
const sse = (value: unknown) => "data: " + JSON.stringify(value) + "\n\n";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});
it("keeps reasoning private and maps a complete answer", async () => {
  vi.stubEnv("NVIDIA_API_KEY", "test-key");
  vi.stubGlobal(
    "fetch",
    async () =>
      new Response(
        sse({
          choices: [
            { delta: { reasoning_content: "private reasoning trace" } },
          ],
        }) +
          sse({
            choices: [
              { delta: { content: "Final answer" }, finish_reason: "stop" },
            ],
          }) +
          "data: [DONE]\n\n",
      ),
  );
  const opened = await openNvidiaStream(request, {
    requestId: "r",
    signal: new AbortController().signal,
  });
  const events = [];
  for await (const event of opened.events) events.push(event);
  expect(JSON.stringify(events)).not.toContain("private reasoning trace");
  expect(
    events.some((e) => e.type === "delta" && e.text === "Final answer"),
  ).toBe(true);
  expect(events.at(-1)).toMatchObject({ type: "finish", reason: "stop" });
});
it("does not label EOF or malformed JSON as a completed answer", async () => {
  vi.stubEnv("NVIDIA_API_KEY", "test-key");
  for (const body of [
    sse({ choices: [{ delta: { content: "Partial" } }] }),
    "data: invalid\n\n",
  ]) {
    vi.stubGlobal("fetch", async () => new Response(body));
    const opened = await openNvidiaStream(request, {
      requestId: "r",
      signal: new AbortController().signal,
    });
    const events = [];
    for await (const event of opened.events) events.push(event);
    expect(events.at(-1)).toMatchObject({
      type: "error",
      code: "protocol_error",
    });
  }
});
it("selects adaptive bounded reasoning and enough output space for a roadmap", () => {
  const ordinary = buildProviderBody(request),
    deep = buildProviderBody({
      ...request,
      mode: "roadmap",
      reasoning: "auto",
    });
  expect(ordinary.chat_template_kwargs.enable_thinking).toBe(false);
  expect(deep.chat_template_kwargs.enable_thinking).toBe(true);
  expect(deep.max_tokens).toBeGreaterThan(ordinary.max_tokens);
  expect(deep.messages[0].role).toBe("system");
});
it("uses the working hosted effort control and canonical message alternation", async () => {
  vi.stubEnv("NVIDIA_API_KEY", "test-key");
  vi.stubGlobal("fetch", async (_url: string, options: RequestInit) => {
    const body = JSON.parse(options.body as string);
    if (
      "thinking_token_budget" in body ||
      "reasoning_budget" in body.chat_template_kwargs ||
      "low_effort" in body.chat_template_kwargs
    )
      return new Response("Unsupported reasoning configuration", {
        status: 400,
      });
    return new Response(
      sse({ choices: [{ delta: { content: "4" }, finish_reason: "stop" }] }) +
        "data: [DONE]\n\n",
    );
  });
  const opened = await openNvidiaStream(
    { ...request, reasoning: "deep" },
    { requestId: "r", signal: new AbortController().signal },
  );
  const events = [];
  for await (const e of opened.events) events.push(e);
  expect(events.at(-1)).toMatchObject({ type: "finish", reason: "stop" });
  expect(buildProviderBody(request).messages.map((m) => m.role)).toEqual([
    "system",
    "user",
  ]);
});
it("maps authentication errors to a safe configuration error", async () => {
  vi.stubEnv("NVIDIA_API_KEY", "test-key");
  vi.stubGlobal(
    "fetch",
    async () => new Response("secret upstream detail", { status: 401 }),
  );
  await expect(
    openNvidiaStream(request, {
      requestId: "r",
      signal: new AbortController().signal,
    }),
  ).rejects.toMatchObject({ code: "not_configured", status: 503 });
});
it("turns a stalled stream into a deadline error and closes its reader", async () => {
  vi.useFakeTimers();
  vi.stubEnv("NVIDIA_API_KEY", "test-key");
  let cancelled = false;
  vi.stubGlobal(
    "fetch",
    async () =>
      new Response(
        new ReadableStream({
          cancel() {
            cancelled = true;
          },
        }),
      ),
  );
  const opened = await openNvidiaStream(request, {
    requestId: "r",
    signal: new AbortController().signal,
    deadlines: { firstContentMs: 45000, idleMs: 45000, totalMs: 180000 },
  });
  const events: unknown[] = [];
  const completed = (async () => {
    for await (const event of opened.events) events.push(event);
  })();
  await vi.advanceTimersByTimeAsync(45001);
  await completed;
  expect(events.at(-1)).toMatchObject({
    type: "error",
    code: "provider_timeout",
  });
  expect(cancelled).toBe(true);
});
