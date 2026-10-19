"use client";
import { useRef, useState } from "react";
import type { Locale, SavedConversation } from "@/types/chat";
import {
  listDevicePlans,
  saveDevicePlan,
  deleteDevicePlan,
  type DevicePlan,
} from "@/lib/chat/plan-library";
import { strings } from "@/lib/chat/strings";
export function PlanLibrary({
  locale,
  onOpen,
  onNotice,
}: {
  locale: Locale;
  onOpen: (plan: SavedConversation) => void;
  onNotice: (text: string) => void;
}) {
  const t = strings(locale),
    [plans, setPlans] = useState(listDevicePlans),
    removed = useRef<DevicePlan | null>(null),
    [undo, setUndo] = useState(false);
  function remove(plan: DevicePlan) {
    const result = deleteDevicePlan(plan.id);
    if (result.ok) {
      removed.current = plan;
      setUndo(true);
      setPlans(listDevicePlans());
    } else onNotice("Unable to update saved plans on this device.");
  }
  return (
    <section className="adv-tool-section">
      <h2>{t.library}</h2>
      <p>{t.savedDevice}</p>
      {!plans.length && <p>{t.emptyPlans}</p>}
      {plans.map((plan) => (
        <article className="adv-library-item" key={plan.id}>
          <label className="adv-library-title">
            {locale === "bn" ? "পরিকল্পনার নাম" : "Plan title"}
            <input
              defaultValue={plan.title}
              key={`${plan.id}-${plan.revision}`}
              maxLength={100}
              onBlur={(e) => {
                const title = e.target.value.trim();
                if (!title || title === plan.title) return;
                const result = saveDevicePlan({ ...plan, title });
                if (result.ok) setPlans(listDevicePlans());
                else
                  onNotice(
                    "This plan changed in another tab. Reopen it before renaming.",
                  );
              }}
            />
          </label>
          <p>
            {new Date(plan.updatedAt).toLocaleDateString(
              locale === "bn" ? "bn-BD" : "en-GB",
            )}
            {plan.archived
              ? ` · ${locale === "bn" ? "আর্কাইভ করা" : "Archived"}`
              : ""}
          </p>
          <div className="adv-tool-actions">
            <button
              type="button"
              className="mk-button-secondary"
              onClick={() => onOpen(plan)}
            >
              {t.load}
            </button>
            <button
              type="button"
              className="mk-button-secondary"
              onClick={() => {
                const result = saveDevicePlan({
                  ...plan,
                  archived: !plan.archived,
                });
                if (result.ok) setPlans(listDevicePlans());
                else
                  onNotice(
                    "This plan changed in another tab. Reopen the library before editing.",
                  );
              }}
            >
              {plan.archived ? t.restore : t.archive}
            </button>
            <button
              type="button"
              className="adv-note-action"
              onClick={() => remove(plan)}
            >
              {t.delete}
            </button>
          </div>
        </article>
      ))}
      {undo && (
        <button
          type="button"
          className="mk-button-secondary"
          onClick={() => {
            if (removed.current) {
              const result = saveDevicePlan(removed.current);
              if (result.ok) {
                setPlans(listDevicePlans());
                setUndo(false);
              } else
                onNotice(
                  "Unable to restore this plan. The device library may be full.",
                );
            }
          }}
        >
          {locale === "bn" ? "মুছে ফেলা পরিকল্পনা ফেরান" : "Undo deletion"}
        </button>
      )}
    </section>
  );
}
