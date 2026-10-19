"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Lightbulb, NotebookPen, RotateCcw, Send, Square, TriangleAlert } from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { ADVISOR_WELCOME } from "@/lib/advisor-prompt";
import type { ChatMessage, PinnedNote } from "@/types/advisor";
import { AdvisorMessageCard } from "./advisor-message";
import { MarketingBrand } from "./marketing/marketing-brand";
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
    scrollAnchorRef.current?.scrollIntoView({ behavior: sending && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "auto", block: "end" });
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

  // Render-only values derived from existing state; they add no behaviour.
  const liveStatus = sending ? "BizGuide is writing a reply." : messages.length > 1 && messages[messages.length - 1].role === "assistant" ? "BizGuide replied." : "";
  const showPrefill = initialIdea.length > 0 && draft === initialIdea && messages.length === 1;
  // OQ1 (UI-only): send focus back to the Notes button when the drawer closes.
  const notesToggleRef = useRef<HTMLButtonElement>(null);
  function closeNotes() { setNotesOpen(false); notesToggleRef.current?.focus(); }
  return (
    <div className="adv-shell">
      <header className="adv-header">
        <div className="adv-header-bar">
          <div className="adv-header-brand">
            <MarketingBrand />
            <p className="mk-label adv-header-tag">Bangladesh business advisor</p>
          </div>
          <div className="adv-header-actions">
            <button type="button" onClick={resetChat} className="mk-button-secondary adv-header-button"><RotateCcw size={18} strokeWidth={2.5} aria-hidden="true" /><span className="adv-collapse-label">New plan</span></button>
            <button ref={notesToggleRef} type="button" onClick={() => setNotesOpen(true)} className="mk-button-secondary adv-header-button adv-notes-toggle" aria-haspopup="dialog" aria-expanded={notesOpen}><NotebookPen size={18} strokeWidth={2.5} aria-hidden="true" /><span className="adv-collapse-label">Notes</span>{pins.length > 0 && <span className="adv-count"><span className="mk-sr-only">, </span>{pins.length}<span className="mk-sr-only"> saved</span></span>}</button>
            <Link href="/" className="mk-button-secondary adv-header-button" aria-label="Back to homepage"><ArrowLeft size={18} strokeWidth={2.5} aria-hidden="true" /><span className="adv-collapse-label">Back to home</span></Link>
          </div>
        </div>
      </header>

      <div className="adv-body">
        <main className="adv-chat">
          <h1 className="mk-sr-only">BizGuide AI business advisor</h1>
          <section className="adv-transcript" aria-label="Conversation" tabIndex={0}>
            <div className="adv-transcript-inner">
              {messages.map((message) => <AdvisorMessageCard key={message.id} message={message} onPin={addPin} pinnedTexts={pinnedTexts} />)}
              {messages.length === 1 && <section className="adv-starters" aria-labelledby="adv-starters-title"><h2 id="adv-starters-title" className="mk-label adv-starters-title"><Lightbulb size={16} strokeWidth={2.5} aria-hidden="true" /> Try a planning prompt</h2><div className="adv-starter-grid">{starters.map((starter) => <button key={starter} type="button" onClick={() => void requestAdvice(starter)} className="mk-button-secondary adv-starter">{starter}</button>)}</div></section>}
              <div ref={scrollAnchorRef} />
            </div>
          </section>
          <p className="mk-sr-only" role="status">{liveStatus}</p>

          <div className="adv-composer-bar">
            <div className="adv-composer-inner">
              {error && <div className="adv-alert" role="alert"><TriangleAlert size={18} strokeWidth={2.5} aria-hidden="true" /><p className="adv-alert-text">{error}</p>{lastUserText && !sending && <button type="button" onClick={retry} className="mk-button-secondary adv-alert-retry">Retry</button>}</div>}
              {showPrefill && <p id="adv-prefill-note" className="adv-prefill"><span className="mk-label">From the homepage</span> Your idea is in the message box. Edit it, then press Send. Nothing is sent until you do.</p>}
              <form onSubmit={submit} className="adv-composer">
                <label htmlFor="advisor-composer" className="mk-sr-only">Ask BizGuide AI</label>
                <textarea ref={composerRef} id="advisor-composer" value={draft} onChange={(event) => { setDraft(event.target.value); setError(""); }} onKeyDown={handleKeyDown} rows={2} maxLength={4000} placeholder={sending ? "BizGuide is replying… press Stop to interrupt." : "Describe your idea, location, budget, or ask your next business question…"} disabled={sending} aria-describedby={showPrefill ? "adv-composer-hint adv-prefill-note" : "adv-composer-hint"} className="adv-composer-input" />
                <div className="adv-composer-footer">
                  {sending ? <p id="adv-composer-hint" className="adv-composer-hint">BizGuide is replying…</p> : <p id="adv-composer-hint" className="adv-composer-hint adv-composer-hint--keys">Enter to send · Shift + Enter for a new line</p>}
                  {sending ? <button type="button" onClick={stop} className="mk-button-secondary adv-stop" aria-label="Stop response"><Square size={14} strokeWidth={2.5} fill="currentColor" aria-hidden="true" /> Stop</button> : <button type="submit" disabled={!draft.trim()} className="mk-button adv-send" aria-label="Send message"><Send size={18} strokeWidth={2.5} aria-hidden="true" /> Send</button>}
                </div>
              </form>
              <p className="adv-disclaimer">BizGuide can make mistakes. Verify legal, financial, pricing, and local market details with current official sources.</p>
            </div>
          </div>
        </main>

        <div className="adv-sidebar"><PinnedNotes notes={pins} onAdd={(text) => addPin(text)} onUpdate={updatePin} onRemove={removePin} /></div>
      </div>

      {notesOpen && <div className="adv-drawer" role="dialog" aria-modal="true" aria-label="Pinned notes" onKeyDown={(event) => { if (event.key === "Escape") closeNotes(); }}><button type="button" className="adv-drawer-scrim" onClick={closeNotes} aria-label="Close notes overlay" tabIndex={-1} /><div className="adv-drawer-panel"><PinnedNotes notes={pins} onAdd={(text) => addPin(text)} onUpdate={updatePin} onRemove={removePin} onClose={closeNotes} /></div></div>}
      {pinNotice && <div className="adv-toast" role="status"><Check size={16} strokeWidth={2.5} aria-hidden="true" />{pinNotice}</div>}
    </div>
  );
}
