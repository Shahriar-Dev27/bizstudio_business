"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Lightbulb, NotebookPen, RotateCcw, Send, Square } from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { ADVISOR_WELCOME } from "@/lib/advisor-prompt";
import type { ChatMessage, PinnedNote } from "@/types/advisor";
import { AdvisorMessageCard } from "./advisor-message";
import { Brand } from "./brand";
import { PinnedNotes } from "./pinned-notes";

const PIN_STORAGE_KEY = "bizguide-pinned-notes-v1";
const starters = [
  "I have ৳2 lakh. Suggest realistic businesses for my district.",
  "Analyze the best area and season for my business idea.",
  "Help me test demand before I rent a shop.",
  "Create a low-risk 30-day launch plan.",
];

function makeMessage(role: ChatMessage["role"], content: string, streaming = false): ChatMessage {
  return { id: crypto.randomUUID(), role, content, createdAt: Date.now(), streaming };
}

export function AdvisorExperience() {
  const searchParams = useSearchParams();
  const initialIdea = (searchParams.get("idea") || "").slice(0, 500);
  const [messages, setMessages] = useState<ChatMessage[]>([makeMessage("assistant", ADVISOR_WELCOME)]);
  const [draft, setDraft] = useState(initialIdea);
  const [pins, setPins] = useState<PinnedNote[]>([]);
  const [pinsReady, setPinsReady] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [pinNotice, setPinNotice] = useState("");
  const [lastUserText, setLastUserText] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const streamTextRef = useRef("");

  const pinnedTexts = useMemo(() => new Set(pins.map((note) => note.text.trim().toLowerCase())), [pins]);

  // ponytail: notes stay in localStorage while accounts do not exist; move them server-side when cross-device login is introduced.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = JSON.parse(window.localStorage.getItem(PIN_STORAGE_KEY) || "[]") as PinnedNote[];
        if (Array.isArray(saved)) setPins(saved.filter((note) => note && typeof note.text === "string").slice(0, 60));
      } catch { /* Ignore corrupted local notes and start clean. */ }
      setPinsReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (pinsReady) window.localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(pins));
  }, [pins, pinsReady]);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: sending ? "smooth" : "auto", block: "end" });
  }, [messages, sending]);

  useEffect(() => () => abortRef.current?.abort(), []);

  function addPin(text: string, sourceMessageId?: string) {
    const clean = text.trim().slice(0, 500);
    if (!clean) return;
    if (pins.some((note) => note.text.trim().toLowerCase() === clean.toLowerCase())) { setPinNotice("Already pinned"); window.setTimeout(() => setPinNotice(""), 1400); return; }
    setPins((current) => [{ id: crypto.randomUUID(), text: clean, sourceMessageId, createdAt: Date.now() }, ...current]);
    setPinNotice("Pinned to notes");
    window.setTimeout(() => setPinNotice(""), 1400);
  }

  function updatePin(id: string, text: string) { setPins((current) => current.map((note) => note.id === id ? { ...note, text } : note)); }
  function removePin(id: string) { setPins((current) => current.filter((note) => note.id !== id)); }

  async function requestAdvice(text: string) {
    if (sending) return;
    const clean = text.trim();
    if (clean.length < 2) { setError("Describe your question or business idea first."); return; }
    if (clean.length > 4000) { setError("Keep each message under 4,000 characters."); return; }

    const userMessage = makeMessage("user", clean);
    const assistantMessage = makeMessage("assistant", "", true);
    const requestMessages = [...messages, userMessage].filter((message) => !message.streaming).map(({ role, content }) => ({ role, content }));
    setLastUserText(clean);
    setMessages((current) => [...current, userMessage, assistantMessage]);
    setDraft(""); setError(""); setSending(true);
    const controller = new AbortController(); abortRef.current = controller;

    try {
      const response = await fetch("/api/advisor/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: requestMessages }), signal: controller.signal });
      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => ({ error: "The advisor could not respond." })) as { error?: string };
        throw new Error(payload.error || "The advisor could not respond.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      streamTextRef.current = "";

      function consumeEvent(event: string) {
        const data = event
          .split(/\r?\n/)
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trim())
          .join("");
        if (!data || data === "[DONE]") return;

        let chunk: { choices?: Array<{ delta?: { content?: string } }>; error?: { message?: string } };
        try {
          chunk = JSON.parse(data);
        } catch {
          return;
        }

        if (chunk.error?.message) throw new Error(chunk.error.message);
        const token = chunk.choices?.[0]?.delta?.content;
        if (!token) return;

        streamTextRef.current += token;
        setMessages((current) => current.map((message) => message.id === assistantMessage.id ? { ...message, content: streamTextRef.current } : message));
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() || "";
        events.forEach(consumeEvent);
      }

      buffer += decoder.decode();
      if (buffer.trim()) consumeEvent(buffer);

      if (!streamTextRef.current.trim()) throw new Error("The selected model returned an empty response. Please try again.");
      setMessages((current) => current.map((message) => message.id === assistantMessage.id ? { ...message, content: streamTextRef.current, streaming: false } : message));
    } catch (requestError) {
      setMessages((current) => current.filter((message) => message.id !== assistantMessage.id));
      if (requestError instanceof DOMException && requestError.name === "AbortError") setError("Response stopped. You can edit your question and try again.");
      else setError(requestError instanceof Error ? requestError.message : "The advisor is temporarily unavailable.");
    } finally { setSending(false); abortRef.current = null; composerRef.current?.focus(); }
  }

  function submit(event: FormEvent) { event.preventDefault(); void requestAdvice(draft); }
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); if (draft.trim()) void requestAdvice(draft); } }
  function stop() { abortRef.current?.abort(); }
  function resetChat() { abortRef.current?.abort(); setMessages([makeMessage("assistant", ADVISOR_WELCOME)]); setDraft(""); setError(""); setLastUserText(""); }
  function retry() { if (lastUserText) void requestAdvice(lastUserText); }

  return (
    <div className="flex h-dvh min-h-[650px] flex-col overflow-hidden bg-[#050816]">
      <header className="z-20 border-b border-white/10 bg-[#050816]/92 backdrop-blur-xl"><div className="flex min-h-18 items-center justify-between gap-4 px-4 md:px-6"><div className="flex items-center gap-4"><Brand /><span className="hidden h-7 w-px bg-white/10 sm:block" /><div className="hidden sm:block"><p className="text-xs font-bold text-white">Bangladesh Business Advisor</p><p className="flex items-center gap-1.5 text-[10px] text-[#71809b]"><span className="size-1.5 rounded-full bg-[#53e0ff]" /> AI planning workspace</p></div></div><div className="flex items-center gap-2"><button type="button" onClick={resetChat} className="hidden min-h-11 items-center gap-2 rounded-xl px-3 text-xs font-bold text-[#8f9ab2] hover:bg-white/[.06] hover:text-white sm:flex"><RotateCcw size={16} /> New plan</button><button type="button" onClick={() => setNotesOpen(true)} className="relative flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[.045] px-3 text-xs font-bold text-[#b5bed1] hover:border-[#53e0ff]/30 lg:hidden"><NotebookPen size={17} /> Notes{pins.length > 0 && <span className="grid size-5 place-items-center rounded-full bg-[#0891b2] text-[10px] text-white">{pins.length}</span>}</button><Link href="/" className="grid size-11 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-[#9ca7be] hover:text-white" aria-label="Back to homepage"><ArrowLeft size={18} /></Link></div></div></header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main className="relative flex min-h-0 flex-col">
          <div className="soft-grid pointer-events-none absolute inset-0 opacity-25" />
          <Image src="/brand/bizguide-logo.png" alt="" width={620} height={620} loading="eager" className="pointer-events-none absolute left-1/2 top-1/2 w-[min(70vw,620px)] -translate-x-1/2 -translate-y-1/2 opacity-[.035]" aria-hidden="true" />
          <div className="relative min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto grid max-w-4xl gap-6 px-4 py-7 md:px-8 md:py-9">
              {messages.map((message) => <AdvisorMessageCard key={message.id} message={message} onPin={addPin} pinnedTexts={pinnedTexts} />)}
              {messages.length === 1 && <section className="ml-12 mt-1"><p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6f7b96]"><Lightbulb size={14} /> Try a planning prompt</p><div className="grid gap-2 sm:grid-cols-2">{starters.map((starter) => <button key={starter} type="button" onClick={() => void requestAdvice(starter)} className="min-h-14 rounded-xl border border-white/10 bg-white/[.025] px-4 py-3 text-left text-sm font-semibold leading-5 text-[#aeb7ca] hover:border-[#0891b2]/35 hover:bg-[#0891b2]/[.07] hover:text-white">{starter}</button>)}</div></section>}
              <div ref={scrollAnchorRef} />
            </div>
          </div>

          <div className="relative border-t border-white/10 bg-[#070b17]/94 px-3 py-3 backdrop-blur-xl md:px-6 md:py-4">
            <div className="mx-auto max-w-4xl">
              {error && <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-red-400/20 bg-red-400/[.07] px-4 py-2.5 text-sm text-red-200" role="alert"><span>{error}</span>{lastUserText && !sending && <button type="button" onClick={retry} className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold hover:bg-red-300/10">Retry</button>}</div>}
              <form onSubmit={submit} className="rounded-2xl border border-white/12 bg-[#0b1122] p-2 shadow-[0_18px_50px_rgba(0,0,0,.3)] focus-within:border-[#53e0ff]/35"><label htmlFor="advisor-composer" className="sr-only">Ask BizGuide AI</label><textarea ref={composerRef} id="advisor-composer" value={draft} onChange={(event) => { setDraft(event.target.value); setError(""); }} onKeyDown={handleKeyDown} rows={2} maxLength={4000} placeholder="Describe your idea, location, budget, or ask your next business question…" disabled={sending} className="max-h-40 min-h-14 w-full resize-none bg-transparent px-3 py-2 text-base leading-6 text-white outline-none placeholder:text-[#5f6a84] disabled:opacity-60" /><div className="flex items-center justify-between gap-3 px-2 pb-1"><p className="text-[10px] text-[#69758f]">Enter to send • Shift + Enter for a new line</p>{sending ? <button type="button" onClick={stop} className="grid size-10 place-items-center rounded-xl border border-red-400/20 bg-red-400/10 text-red-200" aria-label="Stop response"><Square size={15} className="fill-current" /></button> : <button type="submit" disabled={!draft.trim()} className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#0891b2] to-[#2563eb] text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-35" aria-label="Send message"><Send size={17} /></button>}</div></form>
              <p className="mt-2 text-center text-[10px] text-[#59657e]">BizGuide can make mistakes. Verify legal, financial, pricing, and local market details with current official sources.</p>
            </div>
          </div>
        </main>

        <div className="hidden min-h-0 border-l border-white/10 lg:block"><PinnedNotes notes={pins} onAdd={(text) => addPin(text)} onUpdate={updatePin} onRemove={removePin} /></div>
      </div>

      {notesOpen && <div className="fixed inset-0 z-50 lg:hidden"><button type="button" className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={() => setNotesOpen(false)} aria-label="Close notes overlay" /><div className="absolute inset-y-0 right-0 w-[min(92vw,380px)] border-l border-white/10 shadow-2xl"><PinnedNotes notes={pins} onAdd={(text) => addPin(text)} onUpdate={updatePin} onRemove={removePin} onClose={() => setNotesOpen(false)} /></div></div>}
      {pinNotice && <div className="fixed bottom-24 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#53e0ff]/20 bg-[#0b1424]/95 px-4 py-2 text-xs font-bold text-[#8decff] shadow-2xl" role="status"><Check size={14} />{pinNotice}</div>}
    </div>
  );
}
