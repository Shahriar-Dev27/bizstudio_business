import "./marketing.css";
import Link from "next/link";
import { IBM_Plex_Mono, Josefin_Slab, Space_Grotesk } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { CapabilitySection } from "@/components/marketing/capability-section";
import { FaqSection } from "@/components/marketing/faq-section";
import { HeroSection } from "@/components/marketing/hero-section";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { MarketingBrand } from "@/components/marketing/marketing-brand";
import { NotesSection } from "@/components/marketing/notes-section";

// Self-hosted at build time with font-display: swap; the CSS stacks fall back to Arial / ui-monospace.
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "700"], display: "swap", variable: "--font-mk-sans" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], display: "swap", variable: "--font-mk-mono" });
const josefinSlab = Josefin_Slab({ subsets: ["latin"], style: ["normal", "italic"], display: "swap", variable: "--font-mk-slab", fallback: ["Georgia", "serif"] });

export default function HomePage() {
  return (
    <div className={`marketing-page ${spaceGrotesk.variable} ${plexMono.variable} ${josefinSlab.variable}`}>
      <a href="#main" className="mk-skip-link">Skip to content</a>
      <SiteHeader />
      <main id="main">
        <HeroSection />
        <CapabilitySection />
        <HowItWorks />
        <NotesSection />
        <FaqSection />

        <section className="mk-section mk-closing" aria-labelledby="closing-title">
          <div className="mk-container">
            <div className="mk-panel mk-panel--yellow mk-closing-panel">
              <h2 id="closing-title" className="mk-h2">
                Your business starts with a <span className="mk-slab mk-slab-italic">question.</span>
              </h2>
              <p className="mk-lead">Describe the idea as it is today. The advisor will help you work out what to ask, check, and try next.</p>
              <Link href="/advisor" className="mk-button">Open the advisor <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="mk-footer">
        <div className="mk-container mk-footer-grid">
          <MarketingBrand />
          <p className="mk-footer-note">
            BizGuide AI offers planning guidance, not financial, legal, tax, or investment advice. Verify important financial, legal, and market details with current official or local sources.
          </p>
          <div className="mk-footer-action">
            <Link href="/advisor" className="mk-button">Open the advisor <span aria-hidden="true">↗</span></Link>
          </div>
          <p className="mk-footer-copy">© 2026 BizGuide AI</p>
        </div>
      </footer>
    </div>
  );
}
