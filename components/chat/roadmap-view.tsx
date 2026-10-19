"use client";
import { useId } from "react";
import { Pin } from "lucide-react";
import type { Locale, Roadmap } from "@/types/chat";
import { strings } from "@/lib/chat/strings";
export function RoadmapView({
  roadmap,
  messageId,
  completed = {},
  onToggle,
  onPin,
  locale = "en",
}: {
  roadmap: Roadmap;
  messageId: string;
  completed?: Record<string, boolean>;
  onToggle?: (key: string, done: boolean) => void;
  onPin: (text: string) => void;
  locale?: Locale;
}) {
  const uid = useId().replace(/:/g, ""),
    t = strings(locale),
    steps = roadmap.steps;
  const edges = steps.flatMap((step, index) =>
    step.dependsOn.map((dep) => ({
      from: steps.findIndex((s) => s.id === dep),
      to: index,
    })),
  );
  function toggle(stepId: string, done: boolean) {
    onToggle?.(`${messageId}:${stepId}`, done);
    if (!done) {
      const descendants = new Set([stepId]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const s of steps)
          if (
            !descendants.has(s.id) &&
            s.dependsOn.some((d) => descendants.has(d))
          ) {
            descendants.add(s.id);
            changed = true;
          }
      }
      for (const id of descendants)
        if (id !== stepId) onToggle?.(`${messageId}:${id}`, false);
    }
  }
  return (
    <section className="adv-roadmap" aria-label={roadmap.title}>
      <h3>{roadmap.title}</h3>
      <figure className="adv-workflow-figure">
        <figcaption>{t.workflow}</figcaption>
        <div
          className="adv-workflow-scroll"
          tabIndex={0}
          aria-label={t.workflow}
        >
          <svg
            viewBox={`0 0 ${steps.length * 180} ${120 + edges.length * 7}`}
            style={{ minWidth: steps.length * 180 }}
            role="img"
            aria-labelledby={`${uid}-title`}
          >
            <title id={`${uid}-title`}>
              {roadmap.title}:{" "}
              {steps.map((s, i) => `${i + 1}. ${s.title}`).join(" → ")}
            </title>
            <defs>
              <marker
                id={`${uid}-arrow`}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
              </marker>
            </defs>
            {edges.map((e, i) => (
              <path
                key={`${e.from}-${e.to}`}
                d={`M ${e.from * 180 + 90} 76 V ${100 + i * 7} H ${e.to * 180 + 90} V 77`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                markerEnd={`url(#${uid}-arrow)`}
              />
            ))}
            {steps.map((step, i) => (
              <g key={step.id}>
                <rect
                  x={i * 180 + 10}
                  y={12}
                  width={160}
                  height={64}
                  rx={4}
                  fill={
                    completed[`${messageId}:${step.id}`] ? "#b9d4b5" : "#f4ebdd"
                  }
                  stroke="currentColor"
                  strokeWidth={2}
                />
                <text
                  x={i * 180 + 90}
                  y={34}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight="bold"
                >
                  {i + 1}
                </text>
                <text x={i * 180 + 90} y={56} textAnchor="middle" fontSize={12}>
                  {Array.from(step.title).slice(0, 19).join("")}
                  {Array.from(step.title).length > 19 ? "…" : ""}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <p>{t.diagramHint}</p>
      </figure>
      <ol className="adv-roadmap-steps">
        {steps.map((step, index) => {
          const key = `${messageId}:${step.id}`,
            done = !!completed[key],
            blocked = step.dependsOn.some(
              (dep) => !completed[`${messageId}:${dep}`],
            );
          return (
            <li
              key={step.id}
              className={done ? "adv-roadmap-step is-done" : "adv-roadmap-step"}
            >
              <div className="adv-step-heading">
                <span className="adv-step-number">{index + 1}</span>
                <h4>{step.title}</h4>
                <span className="mk-chip">{step.timing}</span>
              </div>
              <p>
                <strong>{t.action}:</strong> {step.action}
              </p>
              <p>
                <strong>{t.deliverable}:</strong> {step.deliverable}
              </p>
              <p>
                <strong>{t.check}:</strong> {step.check}
              </p>
              {step.dependsOn.length > 0 && (
                <p className="adv-step-dependencies">
                  <strong>{t.depends}:</strong>{" "}
                  {step.dependsOn
                    .map((dep) => {
                      const s = steps.find((s) => s.id === dep)!;
                      return `${steps.indexOf(s) + 1}. ${s.title}`;
                    })
                    .join(" · ")}
                </p>
              )}
              <div className="adv-step-actions">
                <label>
                  <input
                    type="checkbox"
                    checked={done}
                    disabled={(blocked && !done) || !onToggle}
                    onChange={(e) => toggle(step.id, e.target.checked)}
                  />
                  {t.complete}
                </label>
                <button
                  type="button"
                  className="adv-note-action"
                  title={
                    locale === "bn"
                      ? "ধাপের শিরোনাম ও শেষ করার শর্ত পিন করুন"
                      : "Pin this step's title and completion check"
                  }
                  onClick={() =>
                    onPin(
                      `${index + 1}. ${step.title}\n${t.check}: ${step.check}`,
                    )
                  }
                >
                  <Pin size={16} aria-hidden="true" />
                  {t.pinStep}
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
