"use client";

import { Bot, Pin, UserRound } from "lucide-react";
import type { ChatMessage } from "@/types/advisor";

function InlineText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return <>{parts.map((part, index) => part.startsWith("**") && part.endsWith("**") ? <strong key={index} className="font-bold text-white">{part.slice(2, -2)}</strong> : <span key={index}>{part}</span>)}</>;
}

function cleanLine(line: string) {
  return line.replace(/^#{1,4}\s*/, "").replace(/^[-*]\s+/, "").replace(/^\d+[.)]\s+/, "").replace(/\*\*/g, "").trim();
}

export function AdvisorMessageCard({ message, onPin, pinnedTexts }: { message: ChatMessage; onPin: (text: string, sourceMessageId: string) => void; pinnedTexts: Set<string> }) {
  const assistant = message.role === "assistant";
  const lines = message.content.split("\n").filter((line, index, array) => line.trim() || (index > 0 && array[index - 1].trim()));

  return (
    <article className={`group flex gap-3 ${assistant ? "items-start" : "items-start justify-end"}`} aria-label={assistant ? "BizGuide AI message" : "Your message"}>
      {assistant && <span className="mt-1 grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#53e0ff] to-[#7c5cff] text-white shadow-[0_8px_24px_rgba(83,224,255,.14)]"><Bot size={18} /></span>}
      <div className={`max-w-[88%] rounded-2xl px-4 py-3.5 md:max-w-[82%] ${assistant ? "rounded-tl-sm border border-white/10 bg-white/[.045] text-[#c6cddd]" : "rounded-tr-sm bg-gradient-to-br from-[#7658f5] to-[#5736c9] text-white shadow-[0_12px_30px_rgba(87,54,201,.2)]"}`}>
        {message.streaming && !message.content ? <div className="flex min-h-7 items-center gap-1.5" aria-label="BizGuide is thinking"><i className="size-2 animate-bounce rounded-full bg-[#53e0ff] [animation-delay:-.2s]" /><i className="size-2 animate-bounce rounded-full bg-[#7c5cff] [animation-delay:-.1s]" /><i className="size-2 animate-bounce rounded-full bg-[#fd5fb4]" /></div> : (
          <div className="grid gap-2.5 text-[15px] leading-7">
            {lines.map((line, index) => {
              const trimmed = line.trim();
              if (!trimmed) return <span key={index} className="h-1" />;
              const clean = cleanLine(trimmed);
              const heading = /^#{1,4}\s/.test(trimmed);
              const bullet = /^[-*]\s+/.test(trimmed);
              const numbered = /^\d+[.)]\s+/.test(trimmed);
              const pinned = pinnedTexts.has(clean.toLowerCase());
              return (
                <div key={`${index}-${clean.slice(0, 18)}`} className={`relative ${assistant ? "pr-8" : ""}`}>
                  {heading ? <h3 className="mt-2 font-display text-base font-bold text-white"><InlineText text={clean} /></h3> : bullet || numbered ? <p className="flex gap-2"><span className="mt-[11px] size-1.5 shrink-0 rounded-full bg-[#53e0ff]" /><span><InlineText text={clean} /></span></p> : <p><InlineText text={trimmed} /></p>}
                  {assistant && clean.length > 8 && <button type="button" onClick={() => onPin(clean, message.id)} className={`absolute -right-1 top-0 grid size-8 place-items-center rounded-lg transition-opacity ${pinned ? "bg-[#53e0ff]/15 text-[#73e8ff]" : "text-[#6f7b96] opacity-60 hover:bg-white/[.07] hover:text-[#53e0ff] md:opacity-0 md:group-hover:opacity-100"}`} aria-label={pinned ? "This line is pinned" : "Pin this line"} title={pinned ? "Pinned" : "Pin this insight"}><Pin size={14} className={pinned ? "fill-current" : ""} /></button>}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {!assistant && <span className="mt-1 grid size-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[.05] text-[#a9b3ca]"><UserRound size={17} /></span>}
    </article>
  );
}
