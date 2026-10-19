"use client";
import {
  Check,
  Clipboard,
  NotebookPen,
  Pin,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useId, useState } from "react";
import type { PinnedNote } from "@/types/advisor";
import type { Locale } from "@/types/chat";
import { strings } from "@/lib/chat/strings";
export function PinnedNotes({
  notes,
  onAdd,
  onUpdate,
  onRemove,
  onClose,
  locale = "en",
}: {
  notes: PinnedNote[];
  onAdd: (text: string) => void;
  onUpdate: (id: string, text: string) => void;
  onRemove: (id: string) => void;
  onClose?: () => void;
  locale?: Locale;
}) {
  const t = strings(locale),
    [draft, setDraft] = useState(""),
    [editingId, setEditingId] = useState<string | null>(null),
    [editingText, setEditingText] = useState(""),
    [copiedId, setCopiedId] = useState<string | null>(null),
    [copyError, setCopyError] = useState(""),
    id = useId();
  function addNote(event: FormEvent) {
    event.preventDefault();
    const clean = draft.trim();
    if (clean) {
      onAdd(clean);
      setDraft("");
    }
  }
  async function copy(note: PinnedNote) {
    try {
      await navigator.clipboard.writeText(note.text);
      setCopiedId(note.id);
      setCopyError("");
    } catch {
      setCopyError(
        locale === "bn"
          ? "কপি করা যায়নি। লেখাটি নির্বাচন করে নিজে কপি করুন।"
          : "Copy failed. Select the note text and use your browser's copy command.",
      );
    }
  }
  return (
    <aside
      className="adv-notes"
      aria-label={
        locale === "bn" ? "পিন করা ব্যবসার নোট" : "Pinned business notes"
      }
    >
      <div className="adv-notes-head">
        <div className="adv-notes-heading">
          <span className="adv-notes-icon">
            <NotebookPen size={20} aria-hidden="true" />
          </span>
          <div>
            <h2 className="adv-notes-title">{t.pinned}</h2>
            <p className="adv-notes-count">{notes.length} / 60</p>
          </div>
        </div>
        {onClose && (
          <button
            autoFocus
            type="button"
            onClick={onClose}
            className="mk-icon-button adv-notes-close"
            aria-label={t.close}
          >
            <X size={20} aria-hidden="true" />
          </button>
        )}
      </div>
      <form onSubmit={addNote} className="adv-note-form">
        <label htmlFor={id} className="mk-label">
          {t.quickNote}
        </label>
        <div className="adv-note-form-row">
          <input
            id={id}
            value={draft}
            maxLength={500}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              locale === "bn"
                ? "নিজের করণীয় লিখুন…"
                : "Write your own action or reminder…"
            }
            className="adv-note-input"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="mk-icon-button adv-note-add"
            aria-label={t.addNote}
          >
            <Plus size={20} aria-hidden="true" />
          </button>
        </div>
      </form>
      {copyError && (
        <p role="alert" className="adv-storage-notice">
          {copyError}
        </p>
      )}
      <div className="adv-notes-list-wrap">
        {!notes.length ? (
          <div className="adv-notes-empty">
            <Pin size={28} aria-hidden="true" />
            <p className="mk-slab adv-notes-empty-title">{t.noNotes}</p>
            <p className="adv-notes-empty-text">{t.notesHelp}</p>
          </div>
        ) : (
          <div className="adv-notes-list">
            {notes.map((note) => (
              <article key={note.id} className="adv-note">
                {editingId === note.id ? (
                  <>
                    <textarea
                      autoFocus
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      rows={4}
                      maxLength={500}
                      className="adv-note-edit"
                      aria-label={t.editNote}
                    />
                    <div className="adv-note-edit-actions">
                      <button
                        type="button"
                        className="mk-button-secondary adv-note-btn"
                        onClick={() => setEditingId(null)}
                      >
                        {t.cancel}
                      </button>
                      <button
                        type="button"
                        className="mk-button-secondary adv-note-btn"
                        disabled={!editingText.trim()}
                        onClick={() => {
                          onUpdate(note.id, editingText);
                          setEditingId(null);
                        }}
                      >
                        {t.saveNote}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="adv-note-text">{note.text}</p>
                    <div className="adv-note-foot">
                      <span className="mk-label">
                        {!note.conversationId
                          ? locale === "bn"
                            ? "আগের নোট"
                            : "Earlier saved note"
                          : note.kind === "step"
                            ? locale === "bn"
                              ? "রোডম্যাপের ধাপ"
                              : "Roadmap step"
                            : note.sourceMessageId
                              ? locale === "bn"
                                ? "নির্বাচিত লেখা"
                                : "Selected text"
                              : locale === "bn"
                                ? "নিজের নোট"
                                : "Personal note"}
                      </span>
                      <div className="adv-note-actions">
                        <button
                          type="button"
                          onClick={() => void copy(note)}
                          className="adv-note-action"
                          aria-label={
                            copiedId === note.id
                              ? locale === "bn"
                                ? "কপি হয়েছে"
                                : "Copied"
                              : t.copyNote
                          }
                        >
                          {copiedId === note.id ? (
                            <Check size={16} aria-hidden="true" />
                          ) : (
                            <Clipboard size={16} aria-hidden="true" />
                          )}
                        </button>
                        <button
                          type="button"
                          className="adv-note-action"
                          aria-label={t.editNote}
                          onClick={() => {
                            setEditingId(note.id);
                            setEditingText(note.text);
                          }}
                        >
                          <NotebookPen size={18} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="adv-note-action"
                          aria-label={t.removeNote}
                          onClick={() => onRemove(note.id)}
                        >
                          <Trash2 size={18} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
