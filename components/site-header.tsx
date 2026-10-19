"use client";

import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { HashLink } from "./marketing/hash-link";
import { MarketingBrand } from "./marketing/marketing-brand";

// HashLink keeps these as next/link (Back keeps working) and scrolls by hand when the hash is already in the URL.
const links = [
  { label: "Capabilities", hash: "capabilities" },
  { label: "How it works", hash: "how-it-works" },
  { label: "Examples", hash: "examples" },
  { label: "FAQ", hash: "faq" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); toggleRef.current?.focus(); } };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="mk-header">
      <div className="mk-container mk-header-bar">
        <MarketingBrand />
        <nav className="mk-header-nav" aria-label="Main navigation">
          {links.map((link) => <HashLink key={link.hash} hash={link.hash} className="mk-nav-link">{link.label}</HashLink>)}
        </nav>
        <div className="mk-header-action"><Link href="/advisor" className="mk-button">Start planning <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" /></Link></div>
        <button ref={toggleRef} type="button" className="mk-icon-button mk-header-toggle" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mk-mobile-nav" onClick={() => setOpen((value) => !value)}>
          {open ? <X size={22} strokeWidth={2.5} aria-hidden="true" /> : <Menu size={22} strokeWidth={2.5} aria-hidden="true" />}
        </button>
      </div>
      {open && (
        <nav id="mk-mobile-nav" className="mk-mobile-nav" aria-label="Mobile navigation">
          <div className="mk-container mk-mobile-nav-list">
            {links.map((link) => <HashLink key={link.hash} hash={link.hash} onClick={() => setOpen(false)} className="mk-nav-link">{link.label}</HashLink>)}
            <Link href="/advisor" className="mk-button" onClick={() => setOpen(false)}>Start planning <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" /></Link>
          </div>
        </nav>
      )}
    </header>
  );
}
