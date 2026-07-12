"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";

const examples = ["Coffee shop in Sylhet", "Online boutique in Dhaka", "Agro supply store in Rajshahi"];

export function HeroForm() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const value = idea.trim();
    if (value.length < 4) { setError("Tell us a little more about your business idea."); return; }
    router.push(`/advisor?idea=${encodeURIComponent(value)}`);
  }

  return (
    <div>
      <form onSubmit={submit} className="relative rounded-[22px] border border-[#7c5cff]/30 bg-[#0a1020]/90 p-2 shadow-[0_24px_70px_rgba(0,0,0,.4),0_0_50px_rgba(124,92,255,.1)] backdrop-blur">
        <label htmlFor="business-idea" className="sr-only">Describe your business idea</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex min-h-14 flex-1 items-center gap-3 px-3">
            <Sparkles className="shrink-0 text-[#53e0ff]" size={20} aria-hidden="true" />
            <input id="business-idea" value={idea} maxLength={180} onChange={(e) => { setIdea(e.target.value); setError(""); }} placeholder="e.g. I want to open a bakery in Dhaka" className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-[#69748f]" aria-describedby={error ? "idea-error" : undefined} />
          </div>
          <button className="btn-primary min-h-14 whitespace-nowrap sm:px-6" type="submit">Analyze my idea <ArrowRight size={18} aria-hidden="true" /></button>
        </div>
      </form>
      {error && <p id="idea-error" role="alert" className="mt-2 text-sm font-semibold text-[#ff8aaf]">{error}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[#8f99b0]">
        <span className="font-semibold">Try:</span>
        {examples.map((example) => <button key={example} type="button" onClick={() => { setIdea(example); setError(""); }} className="min-h-9 rounded-full border border-white/10 bg-white/[.035] px-3 hover:border-[#53e0ff]/40 hover:bg-[#53e0ff]/[.06] hover:text-[#81ebff]">{example}</button>)}
      </div>
    </div>
  );
}
