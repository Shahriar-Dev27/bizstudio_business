"use client";
import { useLayoutEffect, useRef, useState } from "react";
import type { ChatState } from "@/types/chat";
import { strings } from "@/lib/chat/strings";
import { AdvisorMessageCard } from "../advisor-message";
export function ChatTranscript({
  state,
  onPin,
  pinnedTexts,
  onToggleStep,
  onRetry,
  onContinue,
  onStarter,
}: {
  state: ChatState;
  onPin: (
    text: string,
    messageId?: string,
    kind?: "selection" | "step" | "personal",
  ) => void;
  pinnedTexts: Set<string>;
  onToggleStep: (key: string, done: boolean) => void;
  onRetry: (turnId: string) => void;
  onContinue: (turnId: string) => void;
  onStarter: (text: string) => void;
}) {
  const t = strings(state.locale),
    container = useRef<HTMLElement>(null),
    following = useRef(true),
    lastId = useRef(""),
    [jump, setJump] = useState(false);
  useLayoutEffect(() => {
    const el = container.current;
    if (!el || !following.current) return;
    const last = state.messages.at(-1);
    if (
      last?.role === "assistant" &&
      last.status === "complete" &&
      last.id === lastId.current
    ) {
      const cards = el.querySelectorAll<HTMLElement>(
        "article[aria-label='BizGuide AI message']",
      );
      const card = cards[cards.length - 1];
      if (card) el.scrollTop = card.offsetTop - el.offsetTop;
    } else el.scrollTop = el.scrollHeight;
    lastId.current = last?.id || "";
  }, [state.messages]);
  const starters =
    state.locale === "bn"
      ? [
          "আমার বাজেট ২ লাখ টাকা। কোন ব্যবসা পরীক্ষা করতে পারি?",
          "দোকান ভাড়া নেওয়ার আগে চাহিদা কীভাবে যাচাই করব?",
          "আমার ব্যবসার জন্য ধাপে ধাপে রোডম্যাপ দিন।",
        ]
      : [
          "I have BDT 2 lakh. Help me choose a realistic business to test.",
          "Help me test demand before renting a shop.",
          "Create a step-by-step roadmap for my business.",
        ];
  return (
    <section
      ref={container}
      className="adv-transcript"
      aria-label={state.locale === "bn" ? "কথোপকথন" : "Conversation"}
      tabIndex={0}
      onScroll={() => {
        const el = container.current!;
        following.current =
          el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        setJump(!following.current);
      }}
    >
      <div className="adv-transcript-inner">
        {state.messages.map((message) => (
          <AdvisorMessageCard
            key={message.id}
            message={message}
            phase={state.phase}
            locale={state.locale}
            onPin={onPin}
            pinnedTexts={pinnedTexts}
            completedSteps={state.completedSteps}
            onToggleStep={onToggleStep}
            onRetry={onRetry}
            onContinue={onContinue}
            busy={state.phase !== "idle"}
          />
        ))}
        {state.messages.length === 1 && (
          <div className="adv-starters">
            <h2 className="mk-label">
              {state.locale === "bn"
                ? "এখান থেকে শুরু করতে পারেন"
                : "Start with a useful question"}
            </h2>
            <div className="adv-starter-grid">
              {starters.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  className="mk-button-secondary adv-starter"
                  onClick={() => {
                    following.current = true;
                    onStarter(starter);
                  }}
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {jump && (
        <button
          type="button"
          className="adv-jump-latest mk-button-secondary"
          onClick={() => {
            const el = container.current!;
            el.scrollTop = el.scrollHeight;
            following.current = true;
            setJump(false);
          }}
        >
          {t.latest}
        </button>
      )}
    </section>
  );
}
