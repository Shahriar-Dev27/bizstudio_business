"use client";
import { useLayoutEffect, useRef, useState } from "react";
import { Send, Square } from "lucide-react";
import type { AnswerMode, Locale, ReasoningMode } from "@/types/chat";
import { strings } from "@/lib/chat/strings";
export function ChatComposer({
  value,
  onChange,
  onSend,
  onStop,
  busy,
  reasoning,
  onReasoning,
  locale = "en",
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: (value: string, mode: AnswerMode) => void;
  onStop: () => void;
  busy: boolean;
  reasoning: ReasoningMode;
  onReasoning: (value: ReasoningMode) => void;
  locale?: Locale;
}) {
  const t = strings(locale),
    composing = useRef(false),
    input = useRef<HTMLTextAreaElement>(null),
    [mode, setMode] = useState<AnswerMode>("concise");
  useLayoutEffect(() => {
    if (input.current) {
      input.current.style.height = "auto";
      input.current.style.height = `${Math.min(180, Math.max(56, input.current.scrollHeight))}px`;
    }
  }, [value]);
  const send = () => {
    if (!busy && value.trim().length >= 2) onSend(value, mode);
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
      className="adv-composer"
    >
      <label htmlFor="advisor-composer" className="mk-sr-only">
        {t.ask}
      </label>
      <textarea
        ref={input}
        id="advisor-composer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onCompositionStart={() => {
          composing.current = true;
        }}
        onCompositionEnd={() => {
          composing.current = false;
        }}
        onKeyDown={(e) => {
          if (
            e.key === "Enter" &&
            !e.shiftKey &&
            !composing.current &&
            !e.nativeEvent.isComposing
          ) {
            e.preventDefault();
            send();
          }
        }}
        rows={2}
        maxLength={4000}
        placeholder={t.placeholder}
        readOnly={busy}
        aria-describedby="adv-composer-hint"
        className="adv-composer-input"
      />
      <div className="adv-composer-options">
        <label>
          <span className="mk-sr-only">
            {locale === "bn" ? "উত্তরের ধরন" : "Answer format"}
          </span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as AnswerMode)}
            disabled={busy}
          >
            <option value="concise">{t.concise}</option>
            <option value="detail">{t.detail}</option>
            <option value="roadmap">{t.roadmap}</option>
          </select>
        </label>
        <label>
          <span className="mk-sr-only">{t.reasoning}</span>
          <select
            aria-label={t.reasoning}
            value={reasoning}
            onChange={(e) => onReasoning(e.target.value as ReasoningMode)}
            disabled={busy}
          >
            <option value="auto">{t.auto}</option>
            <option value="quick">{t.quick}</option>
            <option value="deep">{t.deep}</option>
          </select>
        </label>
        <span className="adv-char-count">{value.length}/4000</span>
      </div>
      <div className="adv-composer-footer">
        <p
          id="adv-composer-hint"
          className="adv-composer-hint adv-composer-hint--keys"
        >
          {busy
            ? locale === "bn"
              ? "উত্তর তৈরি হচ্ছে…"
              : "Preparing your answer…"
            : locale === "bn"
              ? "Enter: পাঠান · Shift+Enter: নতুন লাইন"
              : "Enter to send · Shift+Enter for a new line"}
        </p>
        {busy ? (
          <button
            type="button"
            onClick={onStop}
            className="mk-button-secondary adv-stop"
            aria-label={t.stop}
          >
            <Square size={14} fill="currentColor" aria-hidden="true" />
            {locale === "bn" ? "থামান" : "Stop"}
          </button>
        ) : (
          <button
            type="submit"
            disabled={value.trim().length < 2}
            className="mk-button adv-send"
            aria-label={t.send}
          >
            <Send size={17} aria-hidden="true" />
            {locale === "bn" ? "পাঠান" : "Send"}
          </button>
        )}
      </div>
    </form>
  );
}
