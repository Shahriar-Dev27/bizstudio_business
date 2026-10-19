// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useAdvisorChat } from "@/hooks/use-advisor-chat";
afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.unstubAllGlobals();
});
it("keeps generated content recoverable, preserves a stopped answer and retries one user turn", async () => {
  let output: ReadableStreamDefaultController<Uint8Array>;
  vi.stubGlobal(
    "fetch",
    async () =>
      new Response(
        new ReadableStream<Uint8Array>({
          start(c) {
            output = c;
          },
        }),
      ),
  );
  const { result } = renderHook(() => useAdvisorChat());
  await act(async () => {
    void result.current.send("Help me test demand");
  });
  await waitFor(() =>
    expect(result.current.state.activeAttemptId).toBeTruthy(),
  );
  const event = {
    type: "delta",
    requestId: "r",
    attemptId: result.current.state.activeAttemptId,
    text: "Useful partial advice",
  };
  await act(async () => {
    output!.enqueue(
      new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`),
    );
  });
  await waitFor(() =>
    expect(result.current.state.messages.at(-1)?.content).toBe(
      "Useful partial advice",
    ),
  );
  act(() => result.current.stop());
  await waitFor(() =>
    expect(result.current.state.messages.at(-1)?.status).toBe("interrupted"),
  );
  expect(result.current.state.messages.at(-1)?.content).toBe(
    "Useful partial advice",
  );
  await act(async () => {
    void result.current.retry(result.current.state.messages.at(-1)!.turnId!);
  });
  expect(
    result.current.state.messages.filter((m) => m.role === "user"),
  ).toHaveLength(1);
  act(() => result.current.newConversation());
  await waitFor(() => expect(result.current.state.messages).toHaveLength(1));
  expect(result.current.state.error).toBe("");
});
it("flushes a just-edited draft when leaving before autosave debounce", async () => {
  const view = renderHook(() => useAdvisorChat());
  await waitFor(() => expect(view.result.current.ready).toBe(true));
  act(() =>
    view.result.current.apply({ type: "draft", value: "New unsaved draft" }),
  );
  view.unmount();
  expect(
    JSON.parse(sessionStorage.getItem("bizguide-chat-session-v1") || "{}")
      .draft,
  ).toBe("New unsaved draft");
});
