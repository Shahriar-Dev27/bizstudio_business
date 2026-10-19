"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";

const MAX_LENGTH = 500;
const MIN_LENGTH = 4;

type ExampleKey = "bakery" | "boutique" | "agro";

type Example = {
  key: ExampleKey;
  name: string;
  setting: string;
  prompt: string;
  topics: readonly string[];
};

const EXAMPLES: readonly Example[] = [
  {
    key: "bakery",
    name: "Neighborhood bakery",
    setting: "Dhaka · ৳2 lakh",
    prompt:
      "I want to open a neighborhood bakery in Dhaka with ৳2 lakh.\nWhich products should I start with, and how can I test demand before I rent a shop?",
    topics: [
      "Which first products suit one neighborhood's tastes and daily routines",
      "What ৳2 lakh can and cannot cover: setup versus running costs",
      "A preorder pilot before committing to a shop lease",
      "Supplier quotes, equipment, and food rules to verify locally",
      "Festival and seasonal swings in demand",
    ],
  },
  {
    key: "boutique",
    name: "Online boutique",
    setting: "Dhaka · ৳1.5 lakh",
    prompt:
      "I want to start an online boutique in Dhaka selling women's kurtis with ৳1.5 lakh.\nHow should I choose my first stock, price it, and handle delivery & returns?",
    topics: [
      "Narrowing the niche and choosing a small first batch of stock",
      "Pricing with delivery, packaging, and returns included",
      "Selling through social pages, a marketplace, or both",
      "Courier and cash-on-delivery risks to plan for",
      "Timing around Eid and wedding seasons",
    ],
  },
  {
    key: "agro",
    name: "Agro supply store",
    setting: "Rajshahi · ৳5 lakh",
    prompt:
      "I want to open an agro supply store in Rajshahi with ৳5 lakh.\nWhich seeds, fertilizer, and tools should I stock, and how do I manage credit from farmers?",
    topics: [
      "A first product range built around local crops and seasons",
      "Working capital when farmers buy on credit",
      "Supplier terms, minimum orders, and storage",
      "Licences and product rules to confirm with local authorities",
      "Stocking ahead of planting cycles",
    ],
  },
];

const FIRST = EXAMPLES[0];

/** encodeURIComponent throws URIError on a lone surrogate (possible via paste); valid text is untouched. */
function encodeIdea(value: string): string {
  try {
    return encodeURIComponent(value);
  } catch {
    let safe = "";
    for (let i = 0; i < value.length; i += 1) {
      const unit = value.charCodeAt(i);
      const next = value.charCodeAt(i + 1);
      if (unit >= 0xd800 && unit <= 0xdbff && next >= 0xdc00 && next <= 0xdfff) {
        safe += value[i] + value[i + 1];
        i += 1;
      } else if (unit >= 0xd800 && unit <= 0xdfff) {
        safe += "\uFFFD";
      } else {
        safe += value[i];
      }
    }
    return encodeURIComponent(safe);
  }
}

export function BusinessExamples(): React.JSX.Element {
  const [selectedKey, setSelectedKey] = useState<ExampleKey>(FIRST.key);
  const [text, setText] = useState(FIRST.prompt);

  const selected = EXAMPLES.find((example) => example.key === selectedKey) ?? FIRST;
  const trimmed = text.trim();
  const ready = trimmed.length >= MIN_LENGTH;

  function choose(example: Example) {
    // Re-choosing the current example keeps the user's edits; only a different example replaces the draft.
    if (example.key === selectedKey) return;
    setSelectedKey(example.key);
    setText(example.prompt);
  }

  return (
    <section id="examples" className="mk-section mk-anchor" aria-labelledby="examples-title">
      <div className="mk-container">
        <div className="mk-section-head">
          <p className="mk-eyebrow">Start from an example</p>
          <h2 id="examples-title" className="mk-h2">
            Borrow a question, then <span className="mk-accent mk-slab mk-slab-italic">make it yours.</span>
          </h2>
          <p className="mk-lead">
            Pick a business, change the wording to fit your own plan, and carry it into the advisor.
          </p>
        </div>

        <div className="mk-examples-grid">
          <div role="group" aria-labelledby="examples-pick" className="mk-examples-pick">
            <p id="examples-pick" className="mk-label">Choose an example</p>
            <ul className="mk-examples-list">
              {EXAMPLES.map((example) => {
                const pressed = example.key === selectedKey;
                return (
                  <li key={example.key}>
                    <button type="button" aria-pressed={pressed} onClick={() => choose(example)} className="mk-example-choice">
                      <span className="mk-example-mark" aria-hidden="true">
                        {pressed && <Check size={18} strokeWidth={3.5} />}
                      </span>
                      <span className="mk-example-text">
                        <span className="mk-example-name">{example.name}</span>
                        <span className="mk-label">{example.setting}</span>
                      </span>
                      {pressed && <span className="mk-example-selected mk-label" aria-hidden="true">Selected</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mk-examples-note">
              These starting points are written in advance. Nothing on this page calls the AI.
            </p>
          </div>

          <div className="mk-panel mk-panel--sage mk-examples-editor">
            <div className="mk-examples-field">
              <label htmlFor="example-question" className="mk-label">Your question — edit it freely</label>
              <textarea
                id="example-question"
                value={text}
                maxLength={MAX_LENGTH}
                rows={5}
                onChange={(event) => setText(event.target.value)}
                className="mk-textarea"
                aria-describedby="example-count example-helper"
              />
              <p id="example-count" className="mk-label">{text.length} / {MAX_LENGTH} characters</p>
            </div>

            <div className="mk-examples-action">
              {ready ? (
                <Link
                  href={`/advisor?idea=${encodeIdea(trimmed)}`}
                  prefetch={false}
                  className="mk-button mk-examples-go"
                  aria-describedby="example-helper"
                >
                  Open in the advisor <span aria-hidden="true">↗</span>
                </Link>
              ) : (
                <button type="button" aria-disabled="true" className="mk-button mk-examples-go" aria-describedby="example-helper">
                  Open in the advisor <span aria-hidden="true">↗</span>
                </button>
              )}
              <p id="example-helper" aria-live="polite" className="mk-examples-helper">
                {ready
                  ? "Opens the advisor with this text in the message box. Nothing is sent until you press send."
                  : `Write at least ${MIN_LENGTH} characters to open the advisor.`}
              </p>
            </div>

            <div className="mk-examples-topics">
              <h3 className="mk-label">What the advisor can explore for “{selected.name}”</h3>
              <ul className="mk-examples-topic-list">
                {selected.topics.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
