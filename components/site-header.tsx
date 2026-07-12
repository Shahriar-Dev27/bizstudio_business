"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Brand } from "./brand";

const links = [
  { label: "Product", href: "/#product" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Insights", href: "/#insights" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050816]/82 backdrop-blur-xl">
      <div className="container-shell flex min-h-18 items-center justify-between gap-6">
        <Brand />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {links.map((link) => <Link key={link.href} href={link.href} className="rounded-lg py-2 text-sm font-semibold text-[#9da7bd] hover:text-[#53e0ff]">{link.label}</Link>)}
        </nav>
        <div className="hidden md:block"><Link href="/advisor" className="btn-primary">Start planning <span aria-hidden="true">→</span></Link></div>
        <button type="button" className="grid size-11 place-items-center rounded-xl border border-white/10 bg-white/[.05] md:hidden" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <nav className="container-shell grid gap-1 border-t border-white/10 py-4 md:hidden" aria-label="Mobile navigation">
          {links.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="flex min-h-12 items-center rounded-xl px-3 font-semibold hover:bg-white/[.06]">{link.label}</Link>)}
          <Link href="/advisor" className="btn-primary mt-2" onClick={() => setOpen(false)}>Start planning <span aria-hidden="true">→</span></Link>
        </nav>
      )}
    </header>
  );
}
