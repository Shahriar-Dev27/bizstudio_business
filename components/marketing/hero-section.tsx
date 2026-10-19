import { HeroForm } from "@/components/hero-form";
import { HashLink } from "./hash-link";

export function HeroSection(): React.JSX.Element {
  return (
    <section className="mk-hero" aria-labelledby="hero-title">
      <div className="mk-container">
        <h1 id="hero-title" className="mk-hero-title">
          Big idea.<br />
          <span className="mk-accent mk-slab mk-slab-italic">What’s next?</span>
        </h1>
        <div className="mk-hero-grid">
          <div className="mk-hero-copy">
            <p className="mk-lead">
              Your business planning partner for Bangladesh. Turn a rough idea into clear questions, practical checks, and a <em className="mk-emphasis">first small test</em>.
            </p>
            <HeroForm appearance="marketing" />
            <div className="mk-hero-actions">
              <HashLink hash="how-it-works" className="mk-button-secondary">See how it works</HashLink>
            </div>
          </div>
          <aside className="mk-preview" aria-label="Example conversation">
            <div className="mk-panel mk-panel--sage mk-preview-card">
              <div className="mk-preview-bar">
                <span className="mk-chip">Example</span>
                <p className="mk-label">Illustrative example — not a live AI response.</p>
              </div>
              <div className="mk-bubble mk-bubble--user">I want to open a bakery in Dhaka with ৳2 lakh.</div>
              <div className="mk-bubble mk-bubble--advisor">
                <p className="mk-bubble-lead">A good first pass starts with questions like:</p>
                <ul className="mk-bubble-list">
                  <li>Who will buy first: families, offices, or both?</li>
                  <li>Which neighborhood, and what rent can ৳2 lakh carry?</li>
                  <li>What small test could you run before a full launch?</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
