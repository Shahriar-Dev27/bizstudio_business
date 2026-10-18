import Link from "next/link";
import { Minus, Plus } from "lucide-react";

type Faq = { question: string; answer: React.ReactNode };

const FAQS: readonly Faq[] = [
  {
    question: "What does the advisor actually do?",
    answer: (
      <>
        <p>
          BizGuide AI is a conversational planning partner for business ideas in Bangladesh. It asks the one to three questions that would change its advice, looks at your idea through lenses such as customers, location, budget, operations, timing, and risks, and finishes with prioritized next actions. When it fits, it also suggests lower-capital options like a pilot, a home or online start, or preorders.
        </p>
        <p>It is guidance for thinking and testing an idea, not a promise that a business will succeed.</p>
      </>
    ),
  },
  {
    question: "Does it use live market data?",
    answer: (
      <>
        <p>
          No. The advisor has no market-research, browsing, or price-lookup tools. It cannot see current rents, competitor counts, supplier prices, or demand.
        </p>
        <p>
          What it can do is point out assumptions, explain how to check them, and give calculation frameworks or clearly labeled illustrative ranges. Verify prices, rules, and market details with current local sources before you spend money.
        </p>
      </>
    ),
  },
  {
    question: "Can I write in Bangla or Banglish?",
    answer: (
      <p>
        Yes. You can write in English, Bangla, or Banglish (Bangla in English letters), and the advisor is set up to understand all three and reply in the language you prefer. This is conversation support only: the website’s own menus and buttons are in English.
      </p>
    ),
  },
  {
    question: "What is sent to the AI provider?",
    answer: (
      <>
        <p>
          The messages you submit in the advisor, along with earlier messages from the same conversation, are sent through this site’s server to the configured AI provider to generate a reply. The server code is set up for OpenRouter. Your ideas do not stay on your device, so leave out sensitive personal or financial details.
        </p>
        <p>
          The idea box on this page sends nothing by itself. It opens the advisor with your text as an editable draft, carried in the page address, and nothing is sent until you submit a message there. The app has no accounts or database of its own; how the provider handles messages is up to the provider.
        </p>
      </>
    ),
  },
  {
    question: "What is saved, and what is not?",
    answer: (
      <>
        <p>
          Pinned notes are saved in this browser on this device. Because there are no accounts, they do not sync to other devices, and clearing site data removes them.
        </p>
        <p>
          The chat itself is session-only. If you reload the advisor or leave it, the conversation starts over, so pin the recommendations you want to keep.
        </p>
      </>
    ),
  },
  {
    question: "How do I begin?",
    answer: (
      <>
        <p>
          Type your idea in the box at the top of this page, or <Link href="/advisor" className="mk-text-link">open the advisor</Link> directly. A rough sentence is enough. Adding the place, your budget in taka, and your experience makes the first answer more useful.
        </p>
        <p>The live conversation works when the site’s AI provider is configured on the server.</p>
      </>
    ),
  },
];

export function FaqSection(): React.JSX.Element {
  return (
    <section id="faq" className="mk-section mk-anchor" aria-labelledby="faq-title">
      <div className="mk-container mk-faq-grid">
        <div className="mk-faq-head">
          <p className="mk-eyebrow">Before you begin</p>
          <h2 id="faq-title" className="mk-h2">
            Straight <span className="mk-accent mk-slab mk-slab-italic">answers.</span>
          </h2>
          <p className="mk-lead">What the advisor can and cannot do, and what happens to what you type.</p>
        </div>
        <div className="mk-faq-list">
          {FAQS.map(({ question, answer }) => (
            <details key={question} className="mk-faq">
              <summary>
                <span className="mk-faq-question">{question}</span>
                <span className="mk-faq-icon" aria-hidden="true">
                  <Plus size={18} strokeWidth={2.75} className="mk-faq-plus" />
                  <Minus size={18} strokeWidth={2.75} className="mk-faq-minus" />
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
