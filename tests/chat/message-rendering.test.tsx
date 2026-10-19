// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import {
  AdvisorMessageCard,
  selectedAnswerText,
} from "@/components/advisor-message";
const message = {
  id: "m",
  role: "assistant" as const,
  turnId: "t",
  content:
    "1. Research demand\n2. Run a pilot\n3. Review results\n\n| Item | BDT |\n|---|---|\n| Test | 500 |",
  createdAt: 1,
  status: "complete" as const,
};
afterEach(cleanup);
it("uses semantic lists/tables and removes repetitive paragraph pins", () => {
  render(
    <AdvisorMessageCard
      message={message}
      onPin={vi.fn()}
      pinnedTexts={new Set()}
    />,
  );
  expect(screen.getAllByRole("listitem")).toHaveLength(3);
  expect(screen.getByRole("table")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Pin this line" })).toBeNull();
});
it("shows typing instead of unfinished answer text and reveals the completed answer", () => {
  const view = render(
    <AdvisorMessageCard
      message={{
        ...message,
        status: "streaming",
        content: "Unfinished secret answer",
      }}
      phase="typing"
      onPin={vi.fn()}
      pinnedTexts={new Set()}
    />,
  );
  expect(screen.queryByText("Unfinished secret answer")).toBeNull();
  expect(screen.getByText(/AI is typing/)).toBeTruthy();
  view.rerender(
    <AdvisorMessageCard
      message={{ ...message, content: "Finished answer" }}
      onPin={vi.fn()}
      pinnedTexts={new Set()}
    />,
  );
  expect(screen.getByText("Finished answer")).toBeTruthy();
});
it("does not enable script links or execute raw HTML", () => {
  render(
    <AdvisorMessageCard
      message={{
        ...message,
        content: "[Bad](javascript:alert(1))\n<script>alert(1)</script>",
      }}
      onPin={vi.fn()}
      pinnedTexts={new Set()}
    />,
  );
  expect(document.querySelector('a[href^="javascript:"]')).toBeNull();
  expect(document.querySelector("script")).toBeNull();
});
it("accepts only a selection contained in a single answer", () => {
  const root = document.createElement("div"),
    other = document.createElement("p");
  root.textContent = "Precise selected advice";
  other.textContent = "Other message";
  document.body.append(root, other);
  const selection = window.getSelection()!,
    range = document.createRange();
  range.setStart(root.firstChild!, 0);
  range.setEnd(root.firstChild!, 7);
  selection.removeAllRanges();
  selection.addRange(range);
  expect(selectedAnswerText(root, selection)).toBe("Precise");
  range.setEnd(other.firstChild!, 5);
  selection.removeAllRanges();
  selection.addRange(range);
  expect(selectedAnswerText(root, selection)).toBe("");
  selection.removeAllRanges();
  root.remove();
  other.remove();
});
