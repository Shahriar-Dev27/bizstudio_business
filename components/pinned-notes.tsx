"use client";

import { Check, Clipboard, NotebookPen, Pin, Plus, Trash2, X } from "lucide-react";
import { FormEvent, useState } from "react";
import type { PinnedNote } from "@/types/advisor";

export function PinnedNotes({ notes, onAdd, onUpdate, onRemove, onClose }: { notes: PinnedNote[]; onAdd: (text: string) => void; onUpdate: (id: string, text: string) => void; onRemove: (id: string) => void; onClose?: () => void }) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function addNote(event: FormEvent) { event.preventDefault(); const value = draft.trim(); if (!value) return; onAdd(value); setDraft(""); }
  async function copy(note: PinnedNote) { await navigator.clipboard.writeText(note.text); setCopiedId(note.id); window.setTimeout(() => setCopiedId(null), 1400); }
  function save(note: PinnedNote) { const value = editingText.trim(); if (value) onUpdate(note.id, value); setEditingId(null); }

  return (
    <aside className="flex h-full min-h-0 flex-col bg-[#080d1b]" aria-label="Pinned business notes">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#53e0ff]/10 text-[#53e0ff]"><NotebookPen size={18} /></span><div><h2 className="font-display text-sm font-bold">Pinned notes</h2><p className="text-[11px] text-[#77839d]">{notes.length} saved insight{notes.length === 1 ? "" : "s"}</p></div></div>{onClose && <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-xl text-[#8b96af] hover:bg-white/[.06] hover:text-white" aria-label="Close notes"><X size={19} /></button>}</div>

      <form onSubmit={addNote} className="border-b border-white/10 p-4"><label htmlFor="manual-note" className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#78839d]">Quick note</label><div className="flex gap-2"><input id="manual-note" value={draft} maxLength={300} onChange={(event) => setDraft(event.target.value)} placeholder="Write a reminder…" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#050816] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#58647e] focus:border-[#53e0ff]/50" /><button type="submit" disabled={!draft.trim()} className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#7c5cff] text-white disabled:cursor-not-allowed disabled:opacity-40" aria-label="Add note"><Plus size={18} /></button></div></form>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {notes.length === 0 ? <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-white/10 px-5 text-center"><div><Pin className="mx-auto text-[#58647e]" size={24} /><p className="mt-3 text-sm font-bold text-[#a7b0c5]">Important ideas live here</p><p className="mt-1 text-xs leading-5 text-[#6f7b95]">Pin any advisor paragraph or add your own reminder.</p></div></div> : <div className="grid gap-3">{notes.map((note) => <article key={note.id} className="group rounded-2xl border border-white/10 bg-white/[.035] p-3.5 hover:border-[#53e0ff]/20">{editingId === note.id ? <><textarea autoFocus value={editingText} onChange={(event) => setEditingText(event.target.value)} rows={4} maxLength={500} className="w-full resize-none rounded-xl border border-[#53e0ff]/30 bg-[#050816] p-3 text-sm text-white outline-none" /><div className="mt-2 flex justify-end gap-2"><button type="button" onClick={() => setEditingId(null)} className="grid size-9 place-items-center rounded-lg text-[#8994ad] hover:bg-white/[.06]" aria-label="Cancel editing"><X size={15} /></button><button type="button" onClick={() => save(note)} className="grid size-9 place-items-center rounded-lg bg-[#35d49a]/12 text-[#55e4b3]" aria-label="Save note"><Check size={16} /></button></div></> : <><p className="text-sm leading-6 text-[#c0c7d8]" onDoubleClick={() => { setEditingId(note.id); setEditingText(note.text); }}>{note.text}</p><div className="mt-3 flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-wider text-[#59657e]">{note.sourceMessageId ? "From advisor" : "Personal note"}</span><div className="flex gap-1"><button type="button" onClick={() => copy(note)} className="grid size-8 place-items-center rounded-lg text-[#71809b] hover:bg-white/[.06] hover:text-[#53e0ff]" aria-label="Copy note">{copiedId === note.id ? <Check size={14} /> : <Clipboard size={14} />}</button><button type="button" onClick={() => { setEditingId(note.id); setEditingText(note.text); }} className="grid size-8 place-items-center rounded-lg text-[#71809b] hover:bg-white/[.06] hover:text-white" aria-label="Edit note"><NotebookPen size={14} /></button><button type="button" onClick={() => onRemove(note.id)} className="grid size-8 place-items-center rounded-lg text-[#71809b] hover:bg-red-400/10 hover:text-red-300" aria-label="Remove note"><Trash2 size={14} /></button></div></div></>}</article>)}</div>}
      </div>
    </aside>
  );
}
