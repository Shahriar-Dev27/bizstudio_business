"use client";

import { Pin } from "lucide-react";
import type { ChatMessage } from "@/types/advisor";

// ponytail: support only the headings, bullets, and bold text the advisor emits; add a Markdown dependency only when links/tables/code are required.
function InlineText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return <>{parts.map((part, index) => part.startsWith("**") && part.endsWith("**") ? <strong key={index} className="adv-md-strong">{part.slice(2, -2)}</strong> : <span key={index}>{part}</span>)}</>;
}

function cleanLine(line: string) {
  return line.replace(/^#{1,4}\s*/, "").replace(/^[-*]\s+/, "").replace(/^\d+[.)]\s+/, "").replace(/\*\*/g, "").trim();
}

export function AdvisorMessageCard({ message, onPin, pinnedTexts }: { message: ChatMessage; onPin: (text: string, sourceMessageId: string) => void; pinnedTexts: Set<string> }) {
  const assistant = message.role === "assistant";
  const lines = message.content.split("\n").filter((line, index, array) => line.trim() || (index > 0 && array[index - 1].trim()));

  return (
    <article className={`adv-message ${assistant ? "adv-message--assistant" : "adv-message--user"}`} aria-label={assistant ? "BizGuide AI message" : "Your message"} aria-busy={message.streaming ? true : undefined}>
      <div className="adv-message-meta" aria-hidden="true">
        {assistant ? <><span className="adv-message-badge">AI</span><span>BizGuide{message.streaming && message.content ? " · Writing…" : ""}</span></> : <span>You</span>}
      </div>
      {message.streaming && !message.content ? <div className="adv-thinking"><span className="adv-thinking-dots" aria-hidden="true"><i /><i /><i /></span><span className="mk-label">Thinking…</span></div> : (
        <div className="adv-message-body">
          {lines.map((line, index) => {
            const trimmed = line.trim();
            if (!trimmed) return <span key={index} className="adv-md-gap" />;
            const clean = cleanLine(trimmed);
            const heading = /^#{1,4}\s/.test(trimmed);
            const bullet = /^[-*]\s+/.test(trimmed);
            const numbered = /^\d+[.)]\s+/.test(trimmed);
            const pinned = pinnedTexts.has(clean.toLowerCase());
            return (
              <div key={`${index}-${clean.slice(0, 18)}`} className={assistant ? "adv-line adv-line--pinnable" : "adv-line"}>
                {heading ? <h3 className="adv-md-heading"><InlineText text={clean} /></h3> : bullet || numbered ? <p className="adv-md-bullet"><span className="adv-md-marker" aria-hidden="true" /><span><InlineText text={clean} /></span></p> : <p className="adv-md-p"><InlineText text={trimmed} /></p>}
                {assistant && clean.length > 8 && <button type="button" onClick={() => onPin(clean, message.id)} className={pinned ? "adv-pin adv-pin--pinned" : "adv-pin"} aria-label={pinned ? "This line is pinned" : "Pin this line"} title={pinned ? "Pinned" : "Pin this insight"}><Pin size={18} strokeWidth={2.5} fill={pinned ? "currentColor" : "none"} aria-hidden="true" /></button>}
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}
