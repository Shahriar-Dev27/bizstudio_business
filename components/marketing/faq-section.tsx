import Link from "next/link";
import { Minus, Plus } from "lucide-react";

type Faq = { question: string; answer: React.ReactNode };

const FAQS: readonly Faq[] = [
  {
    question: "What does the advisor actually do?",
    answer: (
      <>
        <p>
          BizGuide AI is a conversational planning partner for business ideas in
          Bangladesh. It asks the one to three questions that would change its
          advice, looks at your idea through lenses such as customers, location,
          budget, operations, timing, and risks, and finishes with prioritized
          next actions. When it fits, it also suggests lower-capital options
          like a pilot, a home or online start, or preorders.
        </p>
        <p>
          It is guidance for thinking and testing an idea, not a promise that a
          business will succeed.
        </p>
      </>
    ),
  },
  {
    question: "Does it use live market data?",
    answer: (
      <>
        <p>
          No. The advisor has no market-research, browsing, or price-lookup
          tools. It cannot see current rents, competitor counts, supplier
          prices, or demand.
        </p>
        <p>
          What it can do is point out assumptions, explain how to check them,
          and give calculation frameworks or clearly labeled illustrative
          ranges. Verify prices, rules, and market details with current local
          sources before you spend money.
        </p>
      </>
    ),
  },
  {
    question: "Can I write in Bangla or Banglish?",
    answer: (
      <p>
        Yes. You can write in English, Bangla, or Banglish (Bangla in English
        letters), and the advisor is set up to understand all three and reply in
        the language you prefer. This is conversation support only: the
        website’s own menus and buttons are in English.
      </p>
    ),
  },
  {
    question: "What is sent to the AI provider?",
    answer: (
      <>
        <p>
          Your question, a limited recent conversation history, and the business
          brief you provide are sent through this site’s server to NVIDIA to
          generate a reply. Your ideas do not stay only on your device, so leave
          out sensitive personal or financial details.
        </p>
        <p>
          The idea box carries an editable draft inside this browser tab,
          without placing it in the page address. Nothing is sent to NVIDIA
          until you submit it. On Netlify, shared Redis temporarily stores
          generation jobs and their results so longer replies can finish in the
          background; jobs expire one hour after their last update. NVIDIA’s
          handling of submitted messages is governed by its applicable service
          terms.
        </p>
      </>
    ),
  },
  {
    question: "What is saved, and what is not?",
    answer: (
      <>
        <p>
          Pinned notes are saved in this browser on this device. Because there
          are no accounts, they do not sync to other devices, and clearing site
          data removes them.
        </p>
        <p>
          The chat and draft recover within this browser tab. Use “Save on this
          device” to keep a plan beyond the tab session, or export a Markdown
          copy. Device saves do not sync across devices, and clearing site data
          removes them. “New plan” starts a fresh workspace with an undo option.
        </p>
      </>
    ),
  },
  {
    question: "How do I begin?",
    answer: (
      <>
        <p>
          Type your idea in the box at the top of this page, or{" "}
          <Link href="/advisor" className="mk-text-link">
            open the advisor
          </Link>{" "}
          directly. A rough sentence is enough. Adding the place, your budget in
          taka, and your experience makes the first answer more useful.
        </p>
        <p>
          The live conversation works when the site’s AI provider is configured
          on the server.
        </p>
      </>
    ),
  },
];

export function FaqSection(): React.JSX.Element {
  return (
    <section
      id="faq"
      className="mk-section mk-anchor"
      aria-labelledby="faq-title"
    >
      <div className="mk-container mk-faq-grid">
        <div className="mk-faq-head">
          <p className="mk-eyebrow">Before you begin</p>
          <h2 id="faq-title" className="mk-h2">
            Straight{" "}
            <span className="mk-accent mk-slab mk-slab-italic">answers.</span>
          </h2>
          <p className="mk-lead">
            What the advisor can and cannot do, and what happens to what you
            type.
          </p>
        </div>
        <div className="mk-faq-list">
          {FAQS.map(({ question, answer }) => (
            <details key={question} className="mk-faq">
              <summary>
                <span className="mk-faq-question">{question}</span>
                <span className="mk-faq-icon" aria-hidden="true">
                  <Plus size={18} strokeWidth={2.75} className="mk-faq-plus" />
                  <Minus
                    size={18}
                    strokeWidth={2.75}
                    className="mk-faq-minus"
                  />
                </span>
              </summary>
              <div className="mk-faq-answer">{answer}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
