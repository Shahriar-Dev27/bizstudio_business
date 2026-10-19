"use client";

import { Check, Clipboard, NotebookPen, Pin, Plus, Trash2, X } from "lucide-react";
import { FormEvent, useId, useState } from "react";
import type { PinnedNote } from "@/types/advisor";

export function PinnedNotes({ notes, onAdd, onUpdate, onRemove, onClose }: { notes: PinnedNote[]; onAdd: (text: string) => void; onUpdate: (id: string, text: string) => void; onRemove: (id: string) => void; onClose?: () => void }) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function addNote(event: FormEvent) { event.preventDefault(); const value = draft.trim(); if (!value) return; onAdd(value); setDraft(""); }
  async function copy(note: PinnedNote) { await navigator.clipboard.writeText(note.text); setCopiedId(note.id); window.setTimeout(() => setCopiedId(null), 1400); }
  function save(note: PinnedNote) { const value = editingText.trim(); if (value) onUpdate(note.id, value); setEditingId(null); }

  const noteInputId = useId();
  return (
    <aside className="adv-notes" aria-label="Pinned business notes">
      <div className="adv-notes-head">
        <div className="adv-notes-heading">
          <span className="adv-notes-icon"><NotebookPen size={20} strokeWidth={2.5} aria-hidden="true" /></span>
          <div><h2 className="adv-notes-title">Pinned notes</h2><p className="adv-notes-count">{notes.length} saved insight{notes.length === 1 ? "" : "s"}</p></div>
        </div>
        {onClose && <button autoFocus type="button" onClick={onClose} className="mk-icon-button adv-notes-close" aria-label="Close notes"><X size={20} strokeWidth={2.5} aria-hidden="true" /></button>}
      </div>

      <form onSubmit={addNote} className="adv-note-form">
        <label htmlFor={noteInputId} className="mk-label">Quick note</label>
        <div className="adv-note-form-row">
          <input id={noteInputId} value={draft} maxLength={300} onChange={(event) => setDraft(event.target.value)} placeholder="Write a reminder…" className="adv-note-input" />
          <button type="submit" disabled={!draft.trim()} className="mk-icon-button adv-note-add" aria-label="Add note"><Plus size={20} strokeWidth={2.5} aria-hidden="true" /></button>
        </div>
      </form>

      <div className="adv-notes-list-wrap">
        {notes.length === 0 ? <div className="adv-notes-empty"><Pin size={28} strokeWidth={2} aria-hidden="true" /><p className="mk-slab adv-notes-empty-title">Important ideas live here</p><p className="adv-notes-empty-text">Pin any advisor paragraph or add your own reminder.</p></div> : <div className="adv-notes-list">{notes.map((note) => (
          <article key={note.id} className="adv-note">
            {editingId === note.id ? <>
              <textarea autoFocus value={editingText} onChange={(event) => setEditingText(event.target.value)} rows={4} maxLength={500} className="adv-note-edit" aria-label="Edit note text" />
              <div className="adv-note-edit-actions">
                <button type="button" onClick={() => setEditingId(null)} className="mk-button-secondary adv-note-btn" aria-label="Cancel editing">Cancel</button>
                <button type="button" onClick={() => save(note)} className="mk-button-secondary adv-note-btn" aria-label="Save note">Save</button>
              </div>
            </> : <>
              <p className="adv-note-text" onDoubleClick={() => { setEditingId(note.id); setEditingText(note.text); }}>{note.text}</p>
              <div className="adv-note-foot">
                <span className="mk-label">{note.sourceMessageId ? "From advisor" : "Personal note"}</span>
                <div className="adv-note-actions">
                  <button type="button" onClick={() => copy(note)} className="adv-note-action" aria-label={copiedId !== note.id ? "Copy note" : "Copied"}>{copiedId === note.id ? <><Check size={16} strokeWidth={2.5} aria-hidden="true" /><span>Copied</span></> : <><Clipboard size={16} strokeWidth={2.5} aria-hidden="true" /><span>Copy</span></>}</button>
                  <button type="button" onClick={() => { setEditingId(note.id); setEditingText(note.text); }} className="adv-note-action" aria-label="Edit note"><NotebookPen size={18} strokeWidth={2.5} aria-hidden="true" /></button>
                  <button type="button" onClick={() => onRemove(note.id)} className="adv-note-action" aria-label="Remove note"><Trash2 size={18} strokeWidth={2.5} aria-hidden="true" /></button>
                </div>
              </div>
            </>}
          </article>
        ))}</div>}
      </div>
    </aside>
  );
}
