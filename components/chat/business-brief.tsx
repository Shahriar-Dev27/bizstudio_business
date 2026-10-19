"use client";
import type { BusinessBrief, Locale } from "@/types/chat";
import { strings } from "@/lib/chat/strings";
export function BusinessBriefEditor({
  profile,
  onChange,
  locale = "en",
  disabled = false,
}: {
  profile: BusinessBrief;
  onChange: (profile: BusinessBrief) => void;
  locale?: Locale;
  disabled?: boolean;
}) {
  const t = strings(locale);
  return (
    <section className="adv-tool-section">
      <h2>{t.brief}</h2>
      <p>
        {locale === "bn"
          ? "শুধু আপনার নিশ্চিত করা তথ্য লিখুন। এই তথ্য পরের প্রশ্নেও মনে রাখা হবে।"
          : "Add only information you confirm. This context stays with your plan across follow-up questions."}
      </p>
      <div className="adv-brief-grid">
        {(
          [
            ["idea", t.idea, 500],
            ["location", t.location, 120],
            ["experience", t.experience, 240],
            ["stage", t.stage, 80],
          ] as const
        ).map(([key, label, max]) => (
          <label key={key}>
            {label}
            <input
              disabled={disabled}
              value={profile[key] || ""}
              maxLength={max}
              onChange={(e) => onChange({ ...profile, [key]: e.target.value })}
            />
          </label>
        ))}
        <label>
          {t.budget}
          <input
            type="number"
            min={0}
            max={1000000000000}
            step={1}
            disabled={disabled}
            value={profile.budgetBdt ?? ""}
            onChange={(e) =>
              onChange({
                ...profile,
                budgetBdt:
                  e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
          />
        </label>
      </div>
    </section>
  );
}
