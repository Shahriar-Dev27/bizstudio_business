"use client";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Clipboard, Pin } from "lucide-react";
import type { ChatMessage } from "@/types/advisor";
import type { Locale } from "@/types/chat";
import { extractRoadmap } from "@/lib/chat/roadmap";
import { strings } from "@/lib/chat/strings";
import { RoadmapView } from "./chat/roadmap-view";
type Props = {
  message: ChatMessage;
  onPin: (
    text: string,
    messageId?: string,
    kind?: "selection" | "step" | "personal",
  ) => void;
  pinnedTexts: Set<string>;
  phase?: "idle" | "thinking" | "typing";
  locale?: Locale;
  completedSteps?: Record<string, boolean>;
  onToggleStep?: (key: string, done: boolean) => void;
  onRetry?: (turnId: string) => void;
  onContinue?: (turnId: string) => void;
  busy?: boolean;
};
export function selectedAnswerText(
  root: HTMLElement | null,
  selection: Selection | null,
): string {
  if (
    !root ||
    !selection ||
    selection.isCollapsed ||
    selection.rangeCount !== 1
  )
    return "";
  const range = selection.getRangeAt(0);
  if (
    !root.contains(range.startContainer) ||
    !root.contains(range.endContainer)
  )
    return "";
  return selection.toString().trim();
}
function MessageCard({
  message,
  onPin,
  pinnedTexts,
  phase = "thinking",
  locale = "en",
  completedSteps,
  onToggleStep,
  onRetry,
  onContinue,
  busy,
}: Props) {
  const t = strings(locale),
    root = useRef<HTMLDivElement>(null),
    [selected, setSelected] = useState(""),
    [feedback, setFeedback] = useState(""),
    [selectionPosition, setSelectionPosition] = useState({ top: 0, left: 12 });
  const assistant = message.role === "assistant",
    waiting =
      assistant &&
      (message.status === "pending" ||
        message.status === "streaming" ||
        message.streaming);
  const parsed = useMemo(
    () =>
      waiting
        ? { prose: "", roadmap: null, invalid: false }
        : extractRoadmap(message.content),
    [message.content, waiting],
  );
  useEffect(() => {
    if (!selected) return;
    const clear = () => {
      if (!selectedAnswerText(root.current, window.getSelection()))
        setSelected("");
    };
    document.addEventListener("selectionchange", clear);
    return () => document.removeEventListener("selectionchange", clear);
  }, [selected]);
  function capture() {
    const selection = window.getSelection(),
      value = selectedAnswerText(root.current, selection);
    setSelected(value);
    if (value && selection) {
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      setSelectionPosition({
        top: Math.max(8, Math.min(window.innerHeight - 85, rect.bottom + 8)),
        left: Math.max(12, Math.min(window.innerWidth - 330, rect.left)),
      });
    }
    setFeedback(
      value.length > 500
        ? locale === "bn"
          ? "৫০০ অক্ষরের মধ্যে লেখা নির্বাচন করুন।"
          : "Select at most 500 characters to pin."
        : "",
    );
  }
  function pin() {
    if (!selected || selected.length > 500) return;
    onPin(selected, message.id, "selection");
    setSelected("");
    window.getSelection()?.removeAllRanges();
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(selected);
      setFeedback(locale === "bn" ? "কপি হয়েছে" : "Copied");
    } catch {
      setFeedback(
        locale === "bn"
          ? "কপি করা যায়নি। নির্বাচিত লেখা নিজে কপি করুন।"
          : "Copy failed. Use your browser's copy command.",
      );
    }
  }
  const status =
    message.status === "truncated"
      ? t.truncated
      : message.status === "interrupted"
        ? t.interrupted
        : message.status === "failed"
          ? t.failed
          : "";
  return (
    <article
      className={`adv-message adv-message--${assistant ? "assistant" : "user"}`}
      aria-label={assistant ? "BizGuide AI message" : "Your message"}
      aria-busy={waiting || undefined}
      lang={/[\u0980-\u09ff]/.test(message.content) ? "bn" : undefined}
    >
      <div className="adv-message-meta">
        {assistant ? (
          <>
            <span className="adv-message-badge" aria-hidden="true">
              AI
            </span>
            <span>BizGuide</span>
          </>
        ) : (
          <span>{locale === "bn" ? "আপনি" : "You"}</span>
        )}
      </div>
      {waiting ? (
        <div className="adv-preparing">
          <div className="adv-thinking">
            <span className="adv-thinking-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>{phase === "typing" ? t.typing : t.thinking}</span>
          </div>
          <p>{phase === "typing" ? t.working : t.preparing}</p>
        </div>
      ) : (
        <>
          <div
            ref={root}
            className="adv-message-body adv-markdown"
            onMouseUp={capture}
            onKeyUp={capture}
            onTouchEnd={() => setTimeout(capture, 0)}
          >
            {assistant ? (
              <Markdown
                remarkPlugins={[remarkGfm]}
                skipHtml
                components={{
                  a: ({ href, children }) => (
                    <a
                      href={
                        href && /^(https?:|mailto:|#|\/)/i.test(href)
                          ? href
                          : undefined
                      }
                      target={href?.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  ),
                  table: ({ children }) => (
                    <div
                      className="adv-table-scroll"
                      tabIndex={0}
                      role="region"
                      aria-label={
                        locale === "bn" ? "তথ্য সারণি" : "Answer table"
                      }
                    >
                      <table>{children}</table>
                    </div>
                  ),
                }}
              >
                {parsed.prose}
              </Markdown>
            ) : (
              <p className="adv-user-text">{message.content}</p>
            )}
            {assistant && parsed.roadmap && (
              <RoadmapView
                roadmap={parsed.roadmap}
                messageId={message.id}
                completed={completedSteps}
                onToggle={onToggleStep}
                onPin={(text) => onPin(text, message.id, "step")}
                locale={locale}
              />
            )}
          </div>
          {parsed.invalid && (
            <p className="adv-turn-warning">
              {locale === "bn"
                ? "চিত্রটি তৈরি করা যায়নি। লিখিত ধাপগুলো দেখুন বা আবার রোডম্যাপ চাইতে পারেন।"
                : "The diagram could not be prepared. Use the written steps or ask for the roadmap again."}
            </p>
          )}
          {assistant && selected && (
            <div
              className="adv-selection-tools"
              style={{ position: "fixed", ...selectionPosition }}
              role="toolbar"
              aria-label={
                locale === "bn"
                  ? "নির্বাচিত লেখার কাজ"
                  : "Selected text actions"
              }
            >
              <span>{Array.from(selected).length}/500</span>
              <button
                type="button"
                disabled={
                  selected.length > 500 ||
                  pinnedTexts.has(selected.toLowerCase())
                }
                onMouseDown={(e) => e.preventDefault()}
                onClick={pin}
              >
                <Pin size={15} aria-hidden="true" />
                {t.pinSelection}
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => void copy()}
              >
                <Clipboard size={15} aria-hidden="true" />
                {t.copySelection}
              </button>
            </div>
          )}
          {feedback && (
            <p role="status" className="adv-turn-warning">
              {feedback}
            </p>
          )}
          {assistant && !message.welcome && message.content && (
            <p className="adv-select-hint">{t.selectHint}</p>
          )}
          {status && (
            <div className="adv-turn-status">
              <p role="status">{status}</p>
              {message.turnId && (
                <div className="adv-turn-actions">
                  {onRetry && (
                    <button
                      type="button"
                      disabled={busy}
                      className="mk-button-secondary"
                      onClick={() => onRetry(message.turnId!)}
                    >
                      {t.retry}
                    </button>
                  )}
                  {onContinue && message.content && (
                    <button
                      type="button"
                      disabled={busy}
                      className="mk-button-secondary"
                      onClick={() => onContinue(message.turnId!)}
                    >
                      {t.continue}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          {!!message.attempts?.length && (
            <details className="adv-attempts">
              <summary>
                {t.previous} ({message.attempts.length})
              </summary>
              {message.attempts.map((a) => (
                <div key={a.attemptId}>
                  <p className="mk-label">{a.status}</p>
                  <p>{a.content}</p>
                </div>
              ))}
            </details>
          )}
        </>
      )}
    </article>
  );
}
export const AdvisorMessageCard = memo(MessageCard);
