import { Banknote, CalendarDays, ClipboardCheck, MapPin, Store, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Capability = {
  icon: LucideIcon;
  title: string;
  tone: "paper" | "sage" | "yellow";
  question: string;
  help: string;
  output: string;
};

const CAPABILITIES: readonly Capability[] = [
  {
    icon: UsersRound,
    title: "Customers and demand",
    tone: "paper",
    question: "Who is most likely to buy first, and why?",
    help: "Sharpens your target customer and the assumptions behind demand, then suggests low-cost ways to test interest: preorders, conversations, or a small pilot.",
    output: "A short list of customer groups and one demand test to try.",
  },
  {
    icon: MapPin,
    title: "Location and competition",
    tone: "sage",
    question: "Which area fits my customers, and who already serves them?",
    help: "Frames what to look for in an area, such as access, rent pressure, and neighboring businesses, and turns it into a field-visit checklist. It does not look up live competitors.",
    output: "Questions for a site visit and a way to compare places.",
  },
  {
    icon: Banknote,
    title: "Startup budget and working capital",
    tone: "yellow",
    question: "Can ৳2 lakh cover setup and the first few months?",
    help: "Separates one-time setup from running costs using planning frameworks and illustrative ranges with the assumptions shown. These are not verified prices or forecasts.",
    output: "A cost checklist you can fill in with real quotes.",
  },
  {
    icon: Store,
    title: "Operations and suppliers",
    tone: "yellow",
    question: "What do I need in place to run this week after week?",
    help: "Maps equipment, suppliers, people, and the daily workflow, and points out which choices can wait until the idea is proven.",
    output: "A list of supplier and setup questions for your quote calls.",
  },
  {
    icon: CalendarDays,
    title: "Timing and risks",
    tone: "paper",
    question: "When should I start, and what could go wrong?",
    help: "Considers seasons, festivals, and payday patterns, names the risks worth testing early, and says which authority to confirm rules with instead of quoting them.",
    output: "A risk list with who to verify each item with.",
  },
  {
    icon: ClipboardCheck,
    title: "Testing and launch actions",
    tone: "sage",
    question: "What can I do in the next seven days?",
    help: "Turns the conversation into prioritized, affordable, measurable actions, including lower-capital paths such as a pilot, a home or online start, or preorders.",
    output: "A next-actions list you can pin as notes.",
  },
];

export function CapabilitySection(): React.JSX.Element {
  return (
    <section id="capabilities" className="mk-section mk-anchor" aria-labelledby="capabilities-title">
      <div className="mk-container">
        <div className="mk-section-head">
          <p className="mk-eyebrow">What the advisor helps with</p>
          <h2 id="capabilities-title" className="mk-h2">
            Six ways to <span className="mk-accent mk-slab mk-slab-italic">pressure-test</span> an idea.
          </h2>
          <p className="mk-lead">
            Each area starts from a question a Bangladesh entrepreneur really asks and ends with something you can act on.
          </p>
        </div>

        <ul className="mk-cap-grid">
          {CAPABILITIES.map(({ icon: Icon, title, tone, question, help, output }, index) => (
            <li key={title} className={`mk-panel mk-cap mk-cap--${tone}`}>
              <div className="mk-cap-top">
                <span className="mk-cap-icon"><Icon size={22} strokeWidth={2.25} aria-hidden="true" /></span>
                <span className="mk-label">0{index + 1}</span>
              </div>
              <h3 className="mk-h3">{title}</h3>
              <p className="mk-cap-question"><span className="mk-label">You might ask</span> <q>{question}</q></p>
              <p className="mk-cap-help">{help}</p>
              <p className="mk-cap-output"><span className="mk-label">You can leave with</span> {output}</p>
            </li>
          ))}
        </ul>

        <p className="mk-boundary">
          <strong>Guidance, not live data.</strong> BizGuide has no market-research, browsing, or price-lookup tools. Treat any figure it gives as an illustrative estimate, and check rents, prices, and rules with current local sources.
        </p>
      </div>
    </section>
  );
}
