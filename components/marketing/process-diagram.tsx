import { ArrowRight, Banknote, CalendarDays, Check, MapPin, Pin, Store, TriangleAlert, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  CONTEXT_CHIPS,
  EXAMPLE_INPUT,
  FINAL_ACTION_LABEL,
  LENSES,
  PLAN_STEPS,
  PROCESS_FLOW,
  PROCESS_STAGES,
  SAMPLE_LABEL,
} from "./process-content";
import type { LensName } from "./process-content";

type NodeState = "complete" | "active" | "future";

/** Keyed by lens name: a missing or misspelled lens fails type-checking instead of drawing the wrong icon. */
const LENS_ICONS: Record<LensName, LucideIcon> = {
  Customers: UsersRound,
  Location: MapPin,
  Budget: Banknote,
  Operations: Store,
  Timing: CalendarDays,
  Risks: TriangleAlert,
};

const STATE_LABEL: Record<NodeState, string> = { complete: "Done", active: "Now", future: "Next" };

function stateOf(index: number, activeStage: number): NodeState {
  if (index < activeStage) return "complete";
  return index === activeStage ? "active" : "future";
}

function NodeHead({ index, state }: { index: number; state: NodeState }): React.JSX.Element {
  return (
    <div className="mk-node-head">
      <span className="mk-number">{PROCESS_STAGES[index].number}</span>
      <span className="mk-label mk-node-name">{PROCESS_FLOW[index]}</span>
      <span className="mk-label mk-node-state">
        {state === "complete" && <Check size={12} strokeWidth={3} aria-hidden="true" />}
        {STATE_LABEL[state]}
      </span>
    </div>
  );
}

/** Orthogonal connector. The SVG stretches to its grid cell; strokes stay 2px (non-scaling). */
function Connector({ name, stage, area, dir, d }: { name: string; stage: number; area: string; dir: "right" | "down" | "up" | "none"; d: string }): React.JSX.Element {
  return (
    <div className={`mk-conn mk-conn--${dir}`} style={{ gridArea: area }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
        <path d={d} data-process-path={name} data-process-stage={stage} />
      </svg>
    </div>
  );
}

/**
 * Decorative equivalent of the five semantic stages in HowItWorks. Zero-based `activeStage`:
 * earlier nodes read as done (sage), the active node is orange, later nodes stay paper.
 * Hidden from assistive technology and contains nothing keyboard-focusable.
 */
export function ProcessDiagram({ activeStage }: { activeStage: number }): React.JSX.Element {
  const state = (index: number) => stateOf(index, activeStage);

  return (
    <div className="mk-diagram" aria-hidden="true" data-active-stage={activeStage}>
      <div className="mk-diagram-bar">
        <span className="mk-chip">Example</span>
        <span className="mk-label">{SAMPLE_LABEL}</span>
      </div>

      <div className="mk-board">
        <div className="mk-node" style={{ gridArea: "idea" }} data-process-node="idea" data-process-stage="0" data-state={state(0)}>
          <NodeHead index={0} state={state(0)} />
          <p className="mk-node-quote" data-process-detail>{EXAMPLE_INPUT}</p>
        </div>
        <Connector name="idea-context" stage={0} area="c1" dir="right" d="M0 50 H100" />

        <div className="mk-node" style={{ gridArea: "context" }} data-process-node="context" data-process-stage="1" data-state={state(1)}>
          <NodeHead index={1} state={state(1)} />
          <div className="mk-node-chips">
            {CONTEXT_CHIPS.map((chip) => <span key={chip} className="mk-chip" data-process-detail>{chip}</span>)}
          </div>
          <ul className="mk-node-questions">
            {PROCESS_STAGES[1].details.map((question) => <li key={question} data-process-detail>{question}</li>)}
          </ul>
        </div>
        <Connector name="context-lenses" stage={1} area="vc1" dir="down" d="M50 0 V100" />

        <div className="mk-node mk-node--hub" style={{ gridArea: "hub" }} data-process-node="lenses" data-process-stage="2" data-state={state(2)}>
          <NodeHead index={2} state={state(2)} />
          <ul className="mk-lenses">
            {LENSES.map((lens, index) => {
              const Icon = LENS_ICONS[lens.name];
              return (
                <li key={lens.name} className="mk-lens">
                  <svg className="mk-stub" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false"><path d="M50 0 V100" data-process-path={`lens-${index + 1}`} data-process-stage="2" /></svg>
                  <span className="mk-lens-chip" data-process-detail><Icon size={16} strokeWidth={2.25} aria-hidden="true" />{lens.name}</span>
                </li>
              );
            })}
          </ul>
        </div>
        <Connector name="lenses-plan" stage={3} area="vc2" dir="down" d="M50 0 V100" />

        <div className="mk-node" style={{ gridArea: "plan" }} data-process-node="plan" data-process-stage="3" data-state={state(3)}>
          <NodeHead index={3} state={state(3)} />
          <ol className="mk-node-plan">
            {PLAN_STEPS.map((step) => (
              <li key={step.label} data-process-detail>
                <span>{step.label}</span>
                <span className="mk-chip mk-chip--tag">{step.tag}</span>
              </li>
            ))}
          </ol>
        </div>
        <Connector name="plan-notes" stage={4} area="c3" dir="right" d="M0 50 H100" />

        <div className="mk-node" style={{ gridArea: "notes" }} data-process-node="notes" data-process-stage="4" data-state={state(4)}>
          <NodeHead index={4} state={state(4)} />
          <p className="mk-node-quote mk-node-quote--user" data-process-detail>{PROCESS_STAGES[4].details[0]}</p>
          <div className="mk-node-note" data-process-note>
            <Pin size={16} strokeWidth={2.5} aria-hidden="true" />
            <div>
              <p>{PROCESS_STAGES[4].details[1]}</p>
              <p className="mk-label">Sample note — not saved</p>
            </div>
          </div>
          {/* Decorative twin of the real action in HowItWorks. Deliberately not a link: the real one is the keyboard target. */}
          <span className="mk-node-link">{FINAL_ACTION_LABEL} <ArrowRight size={14} strokeWidth={2.5} aria-hidden="true" /></span>
        </div>

        {/* Follow-up loop: notes -> plan, drawn in three cells so it needs no coordinate math. */}
        <Connector name="loop-notes" stage={4} area="loopa" dir="none" d="M50 0 V50 H0" />
        <Connector name="loop-mid" stage={4} area="loopb" dir="none" d="M0 50 H100" />
        <Connector name="loop-plan" stage={4} area="loopc" dir="up" d="M100 50 H50 V0" />
        <span className="mk-label mk-loop-label">Follow-up loop</span>
      </div>
    </div>
  );
}
