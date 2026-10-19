// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ChatComposer } from "@/components/chat/chat-composer";
afterEach(cleanup);
it("does not send Enter during IME composition and leaves Shift+Enter available", () => {
  const send = vi.fn();
  render(
    <ChatComposer
      value="আমার ব্যবসা"
      onChange={vi.fn()}
      onSend={send}
      onStop={vi.fn()}
      busy={false}
      reasoning="auto"
      onReasoning={vi.fn()}
    />,
  );
  const input = screen.getByRole("textbox");
  fireEvent.compositionStart(input);
  fireEvent.keyDown(input, { key: "Enter", isComposing: true });
  expect(send).not.toHaveBeenCalled();
  fireEvent.compositionEnd(input);
  fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
  expect(send).not.toHaveBeenCalled();
  fireEvent.keyDown(input, { key: "Enter" });
  expect(send).toHaveBeenCalledTimes(1);
});
