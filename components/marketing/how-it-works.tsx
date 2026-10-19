"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Check, Pin } from "lucide-react";
import { ProcessDiagram } from "./process-diagram";
import {
  CONTEXT_CHIPS,
  FINAL_ACTION_LABEL,
  LENSES,
  PLAN_STEPS,
  PLAN_TAG_MEANING,
  PROCESS_FLOW,
  PROCESS_STAGES,
  SAMPLE_LABEL,
} from "./process-content";
import type { PlanTag, ProcessStage } from "./process-content";
import { useProcessMotion } from "./use-process-motion";

type StageState = "complete" | "active" | "future";

// Text twin of the colour state, shown beside each stage while the scroll walkthrough is running.
const STAGE_STATE_LABEL: Record<StageState, string> = { complete: "Done", active: "Now", future: "Next" };

const TAGS_IN_LEGEND: readonly PlanTag[] = ["Assumption to test", "Verify locally"];

function StageSample({ index, stage }: { index: number; stage: ProcessStage }): React.JSX.Element | null {
  switch (index) {
    case 0:
      return (
        <div className="mk-sample">
          <p className="mk-label mk-sample-tag">Illustrative sample</p>
          <p className="mk-bubble mk-bubble--user mk-sample-bubble">{stage.details[0]}</p>
        </div>
      );
    case 1:
      return (
        <div className="mk-sample">
          <p className="mk-label mk-sample-tag">Illustrative sample questions</p>
          <ul className="mk-sample-list">
            {stage.details.map((question) => <li key={question}>{question}</li>)}
          </ul>
          <p className="mk-sample-chips">
            <span className="mk-label">Context kept in view</span>
            {CONTEXT_CHIPS.map((chip) => <span key={chip} className="mk-chip">{chip}</span>)}
          </p>
        </div>
      );
    case 2:
      return (
        <div className="mk-sample">
          <p className="mk-label mk-sample-tag">Six lenses</p>
          <ul className="mk-lens-list">
            {LENSES.map((lens) => (
              <li key={lens.name}><strong>{lens.name}</strong> <span>{lens.note}</span></li>
            ))}
          </ul>
        </div>
      );
    case 3:
      return (
        <div className="mk-sample">
          <p className="mk-label mk-sample-tag">Illustrative sample plan</p>
          <ol className="mk-plan-list">
            {PLAN_STEPS.map((step) => (
              <li key={step.label}>
                <span>{step.label}</span>
                <span className="mk-chip mk-chip--tag">{step.tag}</span>
              </li>
            ))}
          </ol>
          <p className="mk-legend">
            {TAGS_IN_LEGEND.map((tag, i) => (
              <span key={tag}>{i > 0 && " "}<strong>{tag}</strong>: {PLAN_TAG_MEANING[tag]}.</span>
            ))}
          </p>
        </div>
      );
    case 4:
      return (
        <div className="mk-sample">
          <p className="mk-label mk-sample-tag">Illustrative follow-up and note</p>
          <p className="mk-bubble mk-bubble--user mk-sample-bubble">{stage.details[0]}</p>
          <div className="mk-panel mk-panel--yellow mk-panel--compact mk-sample-note">
            <Pin size={18} strokeWidth={2.5} aria-hidden="true" />
            <div>
              <p>{stage.details[1]}</p>
              <p className="mk-label">Sample note — not saved</p>
            </div>
          </div>
        </div>
      );
    default:
      return null;
  }
}

export function HowItWorks(): React.JSX.Element {
  // The single authoritative active stage. The hook reports boundary changes only (never per scroll
  // pixel); it reports the finished final stage in every mode without scroll-driven motion.
  const [activeStage, setActiveStage] = useState(0);
  const rootRef = useRef<HTMLElement>(null);
  useProcessMotion(rootRef, setActiveStage);

  return (
    <section ref={rootRef} id="how-it-works" className="mk-section mk-process mk-anchor" aria-labelledby="process-title">
      <div className="mk-container">
        <div className="mk-section-head">
          <p className="mk-eyebrow">One idea, five steps</p>
          <h2 id="process-title" className="mk-h2">
            From ‘what if’ to <span className="mk-accent mk-slab mk-slab-italic">‘what next’.</span>
          </h2>
          <p className="mk-lead">
            Follow one example idea through a typical BizGuide conversation. The walkthrough is fixed explanatory content: nothing here is submitted, sent to an AI, or saved.
          </p>
          <p className="mk-sample-label">
            <span className="mk-chip">Example</span>
            <span className="mk-label">{SAMPLE_LABEL}</span>
          </p>
          <nav className="mk-stepnav" aria-label="Walkthrough stages">
            <ol>
              {PROCESS_STAGES.map((stage) => (
                <li key={stage.id}>
                  <a href={`#${stage.id}`} className="mk-stepnav-link">
                    <span className="mk-number">{stage.number}</span>
                    <span className="mk-sr-only"> {stage.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <div className="mk-process-layout">
          <div className="mk-process-copy">
            <ol className="mk-stages">
              {PROCESS_STAGES.map((stage, index) => {
                const state: StageState = index < activeStage ? "complete" : index === activeStage ? "active" : "future";
                return (
                  <li key={stage.id} className="mk-stage-item">
                    <section id={stage.id} className="mk-stage mk-anchor" data-process-step={index} data-state={state}>
                      <div className="mk-stage-head">
                        <span className="mk-stage-badge mk-number" aria-hidden="true">
                          {stage.number}
                        </span>
                        <p className="mk-label mk-stage-count">
                          Step {stage.number} of {PROCESS_STAGES.length}
                          <span className="mk-stage-state" aria-hidden="true">
                            {state === "complete" && <Check size={12} strokeWidth={3} />}
                            {STAGE_STATE_LABEL[state]}
                          </span>
                        </p>
                        <h3 className="mk-h3 mk-stage-title">{stage.title}</h3>
                      </div>
                      <p className="mk-body mk-stage-text">{stage.description}</p>
                      <StageSample index={index} stage={stage} />
                    </section>
                  </li>
                );
              })}
            </ol>

            <div className="mk-panel mk-panel--yellow mk-finale">
              <h3 className="mk-h3">The full journey</h3>
              <ol className="mk-flow" aria-label="The full process">
                {PROCESS_FLOW.map((name) => <li key={name}>{name}</li>)}
              </ol>
              <p className="mk-body">
                After the first answer you can keep refining: add details, ask “what if”, and pin what you want to keep. BizGuide guides your thinking; the facts still need checking locally.
              </p>
              <Link href="/advisor" className="mk-button">{FINAL_ACTION_LABEL} <span aria-hidden="true">↗</span></Link>
            </div>
          </div>

          <div className="mk-process-visual">
            <ProcessDiagram activeStage={activeStage} />
          </div>
        </div>
      </div>
    </section>
  );
}
