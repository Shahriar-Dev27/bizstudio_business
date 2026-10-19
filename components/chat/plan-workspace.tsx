"use client";
import { useMemo, useState } from "react";
import type { Locale } from "@/types/chat";
import type { PinnedNote } from "@/types/advisor";
import { strings } from "@/lib/chat/strings";
import { calculateBudget } from "@/lib/chat/budget-calculator";
export function PlanWorkspace({
  locale,
  notes,
  completed,
  onToggle,
}: {
  locale: Locale;
  notes: PinnedNote[];
  completed: Record<string, boolean>;
  onToggle: (key: string, done: boolean) => void;
}) {
  const t = strings(locale),
    [inputs, setInputs] = useState({
      price: "",
      unitCost: "",
      fixedCost: "",
      units: "",
    });
  const calculation = useMemo(() => {
    if (Object.values(inputs).some((v) => v === "")) return null;
    try {
      return calculateBudget({
        price: Number(inputs.price),
        unitCost: Number(inputs.unitCost),
        fixedCost: Number(inputs.fixedCost),
        units: Number(inputs.units),
      });
    } catch {
      return "invalid";
    }
  }, [inputs]);
  const currency = (n: number) =>
    new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-BD", {
      style: "currency",
      currency: "BDT",
      maximumFractionDigits: 2,
    }).format(n);
  return (
    <>
      <section className="adv-tool-section">
        <h2>{t.assumptions}</h2>
        <p>
          {locale === "bn"
            ? "নির্বাচিত নোট পড়ে যাচাইয়ের কাজ ঠিক করুন। টিকচিহ্ন মানে নোটটি পর্যালোচনা করেছেন, তথ্যটি প্রমাণিত নয়।"
            : "Review selected notes and decide what to check next. A tick means reviewed, not independently verified."}
        </p>
        {notes.length ? (
          notes.map((n) => (
            <label className="adv-check-note" key={n.id}>
              <input
                type="checkbox"
                checked={!!completed[`note:${n.id}`]}
                onChange={(e) => onToggle(`note:${n.id}`, e.target.checked)}
              />
              <span>{n.text}</span>
            </label>
          ))
        ) : (
          <p>{t.notesHelp}</p>
        )}
      </section>
      <section className="adv-tool-section">
        <h2>{t.calculator}</h2>
        <p>
          {locale === "bn"
            ? "নিজের দাম ও খরচ লিখুন। এখানে বাজারদর অনুমান করা হয় না।"
            : "Use your own prices and costs. These calculations do not estimate market prices."}
        </p>
        <div className="adv-brief-grid">
          {(
            [
              [
                "price",
                locale === "bn"
                  ? "প্রতি ইউনিট বিক্রয়মূল্য"
                  : "Selling price per unit",
              ],
              [
                "unitCost",
                locale === "bn"
                  ? "প্রতি ইউনিট পরিবর্তনশীল খরচ"
                  : "Variable cost per unit",
              ],
              [
                "fixedCost",
                locale === "bn"
                  ? "একই সময়ের স্থির খরচ"
                  : "Fixed costs for the period",
              ],
              [
                "units",
                locale === "bn"
                  ? "একই সময়ে বিক্রীত ইউনিট"
                  : "Units sold in the period",
              ],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                type="number"
                min={0}
                step={key === "units" ? 1 : "0.01"}
                value={inputs[key]}
                onChange={(e) =>
                  setInputs({ ...inputs, [key]: e.target.value })
                }
              />
            </label>
          ))}
        </div>
        {calculation === "invalid" ? (
          <p role="alert">
            {locale === "bn"
              ? "সঠিক, ঋণাত্মক নয় এমন সংখ্যা লিখুন।"
              : "Enter valid non-negative figures and whole units."}
          </p>
        ) : (
          calculation && (
            <dl className="adv-budget-results">
              <div>
                <dt>{locale === "bn" ? "বিক্রয় আয়" : "Revenue"}</dt>
                <dd>{currency(calculation.revenue)}</dd>
              </div>
              <div>
                <dt>
                  {locale === "bn"
                    ? "প্রতি ইউনিট অবদান"
                    : "Contribution per unit"}
                </dt>
                <dd>{currency(calculation.contributionPerUnit)}</dd>
              </div>
              <div>
                <dt>
                  {locale === "bn"
                    ? "আনুমানিক লাভ / ক্ষতি"
                    : "Scenario profit / loss"}
                </dt>
                <dd>{currency(calculation.profit)}</dd>
              </div>
              <div>
                <dt>
                  {locale === "bn" ? "ব্রেক-ইভেন ইউনিট" : "Break-even units"}
                </dt>
                <dd>
                  {calculation.breakEvenUnits === null
                    ? locale === "bn"
                      ? "এই হিসাবে ব্রেক-ইভেন সম্ভব নয়"
                      : "No break-even at this contribution"
                    : calculation.breakEvenUnits}
                </dd>
              </div>
            </dl>
          )
        )}
      </section>
    </>
  );
}
