import { Check, NotebookPen, Pin } from "lucide-react";
import { PINNED_RECOMMENDATION } from "./process-content";

const FEATURES = [
  "Pin a recommendation from any advisor reply.",
  "Add a quick reminder of your own.",
  "Edit, copy, or remove a note whenever you like.",
] as const;

export function NotesSection(): React.JSX.Element {
  return (
    <section id="notes" className="mk-section mk-anchor" aria-labelledby="notes-title">
      <div className="mk-container mk-notes-grid">
        <div className="mk-notes-copy">
          <p className="mk-eyebrow">Keep the useful parts</p>
          <h2 id="notes-title" className="mk-h2">
            Keep what <span className="mk-accent mk-slab mk-slab-italic">matters.</span>
          </h2>
          <p className="mk-lead">
            Good advice is easy to lose in a long chat. Pin the lines worth keeping and they wait for you in a notes panel.
          </p>
          <ul className="mk-checklist">
            {FEATURES.map((feature) => (
              <li key={feature}>
                <span className="mk-checklist-mark"><Check size={16} strokeWidth={3} aria-hidden="true" /></span>
                {feature}
              </li>
            ))}
          </ul>
          <div className="mk-panel mk-panel--sage mk-panel--compact mk-callout">
            <h3 className="mk-label">Where notes live</h3>
            <p>
              Pinned notes are saved in this browser, on this device. There are no accounts, so they do not follow you to another device, and clearing your browser’s site data removes them.
            </p>
            <p>
              The conversation itself is session-only: reload or leave the advisor and the chat starts fresh. Pin what you want to keep.
            </p>
          </div>
        </div>

        <div className="mk-note-demo" role="group" aria-label="Illustrative example of pinned notes">
          <div className="mk-panel mk-panel--yellow mk-note-board">
            <div className="mk-note-board-head">
              <span className="mk-note-board-title"><NotebookPen size={18} strokeWidth={2.25} aria-hidden="true" /> <span className="mk-label">Pinned notes</span></span>
              <span className="mk-chip">Example</span>
            </div>
            <p className="mk-label">Illustrative example — these notes are not saved.</p>
            <div className="mk-note-card">
              <Pin size={16} strokeWidth={2.5} aria-hidden="true" />
              <div>
                <p>{PINNED_RECOMMENDATION}</p>
                <p className="mk-label">From advisor</p>
              </div>
            </div>
            <div className="mk-note-card">
              <NotebookPen size={16} strokeWidth={2.5} aria-hidden="true" />
              <div>
                <p>Ask three nearby offices if they would order for weekday meetings.</p>
                <p className="mk-label">Personal note</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
