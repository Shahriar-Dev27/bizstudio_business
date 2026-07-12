import Link from "next/link";
import { ArrowRight, BadgeCheck, Banknote, CalendarDays, Check, ChevronDown, CircleDot, FileCheck2, Fingerprint, Lightbulb, MapPin, MessageSquareText, Radar, ScanSearch, ShieldCheck, Sparkles, TrendingUp, UsersRound, Zap } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { HeroForm } from "@/components/hero-form";
import { MapExperience } from "@/components/map-experience";
import { Brand } from "@/components/brand";
import { BusinessBento } from "@/components/business-bento";

const steps = [
  { number: "01", icon: MessageSquareText, title: "Tell us the reality", text: "Share the idea, location, budget, experience, target customer, and timeline." },
  { number: "02", icon: Radar, title: "Expose the signals", text: "BizGuide frames the market, place, season, setup, budget, and risk questions." },
  { number: "03", icon: FileCheck2, title: "Move with a roadmap", text: "Leave with an organized brief for field research, testing, and local verification." },
];

const faqs = [
  ["Is the current prototype connected to live market data?", "Not yet. The experience currently uses transparent demonstration logic so you can approve the workflow and visual direction first."],
  ["Can this predict whether my business will succeed?", "No responsible tool can guarantee that. BizGuide helps you challenge assumptions, gather evidence, and make a more informed decision."],
  ["Will it work in Bangla?", "The interface is currently English-first, while the content architecture is ready for Bangla localization in a later milestone."],
  ["Does the demo store my business idea?", "No. There are no accounts or databases in this frontend milestone, and your answers are not sent to an AI provider."],
];

const categories = ["Food & beverage", "Retail", "Online business", "Services", "Agriculture", "Manufacturing", "Local commerce"];

export default function HomePage() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[#11182c] focus:px-4 focus:py-3">Skip to content</a>
      <SiteHeader />
      <main id="main">
        {/* Immersive product hero */}
        <section className="soft-grid relative min-h-[calc(100dvh-72px)] overflow-hidden border-b border-white/10 pb-18 pt-14 lg:pb-24 lg:pt-20">
          <div className="noise-layer pointer-events-none absolute inset-0 opacity-[.12]" />
          <div className="glow-orb -left-48 top-4 size-[520px] bg-[#623cff]" />
          <div className="glow-orb -right-36 top-12 size-[520px] bg-[#03b8dd]" />
          <div className="container-shell relative grid items-center gap-12 lg:grid-cols-[1.02fr_.98fr]">
            <div className="relative z-10">
              <div className="eyebrow mb-7 rounded-full border border-[#53e0ff]/20 bg-[#53e0ff]/[.06] px-3.5 py-2"><span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-[#53e0ff] opacity-70" /><span className="relative inline-flex size-2 rounded-full bg-[#53e0ff]" /></span> Bangladesh business intelligence, simplified</div>
              <h1 className="max-w-[760px] text-[clamp(3rem,6.4vw,5.9rem)] font-extrabold tracking-[-.065em]">Your idea has signals. <span className="gradient-text">Learn to read them.</span></h1>
              <p className="mt-7 max-w-[650px] text-lg leading-8 text-[#b6bed1] md:text-xl">From a rough thought to a location-aware, budget-conscious first plan—before you commit the money.</p>
              <div className="mt-9"><HeroForm /></div>
              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-[#aab3c8]">{["No sign-up", "Bangladesh-first", "Assumptions made visible"].map((item) => <span key={item} className="flex items-center gap-2"><span className="grid size-5 place-items-center rounded-full bg-[#35d49a]/15 text-[#55e4b3]"><Check size={13} /></span>{item}</span>)}</div>
            </div>
            <div className="relative">
              <div className="absolute -left-7 top-12 z-20 hidden rounded-2xl border border-[#53e0ff]/20 bg-[#081020]/90 p-4 shadow-2xl backdrop-blur xl:block float-soft"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-[#35d49a]/15 text-[#55e4b3]"><TrendingUp size={21} /></span><div><p className="text-[11px] font-bold uppercase tracking-widest text-[#7f8aa5]">Signal detected</p><p className="font-display font-bold">Location × demand</p></div></div></div>
              <div className="signal-line rounded-[32px] border border-[#7c5cff]/25 bg-[#0a1022]/75 p-3 shadow-[0_40px_120px_rgba(0,0,0,.5)] backdrop-blur"><MapExperience /></div>
              <div className="absolute -bottom-4 right-4 z-20 hidden rounded-2xl border border-[#fd5fb4]/20 bg-[#100d20]/92 px-4 py-3 shadow-2xl backdrop-blur sm:block"><p className="text-[10px] font-bold uppercase tracking-widest text-[#9a8da5]">Live planning lens</p><div className="mt-1 flex items-center gap-2 text-sm font-bold"><ScanSearch size={17} className="text-[#ff7ec4]" /> 6 decision angles</div></div>
            </div>
          </div>
          <div className="container-shell relative mt-14 grid grid-cols-3 gap-3 border-t border-white/10 pt-7 md:max-w-2xl md:ml-auto md:mr-auto"><Metric value="07" label="focused questions" /><Metric value="06" label="planning lenses" /><Metric value="01" label="clear brief" /></div>
        </section>

        {/* Moving market categories */}
        <div className="overflow-hidden border-b border-white/10 bg-[#080c19] py-4" aria-label="Supported business categories"><div className="marquee-track flex items-center gap-3 pr-3">{[...categories,...categories].map((item,index) => <span key={`${item}-${index}`} className="flex items-center gap-3 whitespace-nowrap rounded-full border border-white/10 bg-white/[.035] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#9ca6bd]"><CircleDot size={12} className="text-[#53e0ff]" />{item}</span>)}</div></div>

        {/* React Bits Magic Bento */}
        <section id="product" className="section-pad relative overflow-hidden scroll-mt-20">
          <div className="glow-orb left-1/3 top-1/3 size-[420px] bg-[#4e32bb] opacity-20" />
          <div className="container-shell relative">
            <div className="mx-auto max-w-3xl text-center"><span className="eyebrow"><Sparkles size={15} /> Intelligence from every angle</span><h2 className="mt-5 text-3xl font-extrabold md:text-5xl">Not another generic AI answer.</h2><p className="mx-auto mt-5 max-w-2xl text-lg text-[#a8b0c5]">Move your cursor across the planning system. Each signal changes the quality of the decision you make.</p></div>
            <div className="mt-12 flex justify-center"><BusinessBento /></div>
          </div>
        </section>

        {/* Product preview */}
        <section id="insights" className="section-pad border-y border-white/10 bg-[#080c19] scroll-mt-20">
          <div className="container-shell grid items-center gap-12 lg:grid-cols-[.78fr_1.22fr]">
            <div><span className="eyebrow"><Fingerprint size={15} /> Built around your reality</span><h2 className="mt-5 text-3xl font-extrabold md:text-5xl">See the decision, not just the data.</h2><p className="mt-5 text-lg text-[#a8b0c5]">BizGuide turns scattered questions into a briefing you can investigate, discuss, and improve.</p><div className="mt-8 grid gap-3">{["Location and operating model", "Budget runway and setup limits", "Local demand and competitor evidence", "Seasonality, risks, and next actions"].map(item => <div key={item} className="flex items-center gap-3 text-sm font-bold text-[#d7dced]"><span className="grid size-7 place-items-center rounded-lg bg-[#7c5cff]/15 text-[#9c86ff]"><Check size={15} /></span>{item}</div>)}</div><Link href="/advisor?idea=I want to launch a neighborhood bakery in Dhaka" className="btn-primary mt-9">Open the guided demo <ArrowRight size={18} /></Link></div>
            <div className="glass rounded-[30px] p-3 md:p-5">
              <div className="overflow-hidden rounded-[23px] border border-white/10 bg-[#070b17]">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-[#fd5fb4]" /><span className="size-2.5 rounded-full bg-[#ffc75f]" /><span className="size-2.5 rounded-full bg-[#35d49a]" /></div><span className="text-[11px] font-bold uppercase tracking-[.18em] text-[#737e99]">Planning brief / Demo</span></div>
                <div className="grid md:grid-cols-[.72fr_1.28fr]">
                  <div className="border-b border-white/10 p-5 md:border-b-0 md:border-r"><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#737e99]">Opportunity radar</p><div className="relative mx-auto mt-6 grid aspect-square max-w-52 place-items-center"><div className="absolute inset-3 rounded-full border border-[#53e0ff]/15" /><div className="absolute inset-10 rounded-full border border-[#7c5cff]/25" /><div className="absolute inset-[4.5rem] rounded-full border border-[#fd5fb4]/25" /><div className="absolute h-px w-full bg-gradient-to-r from-transparent via-[#53e0ff]/30 to-transparent" /><div className="absolute h-full w-px bg-gradient-to-b from-transparent via-[#7c5cff]/30 to-transparent" /><div className="relative grid size-20 place-items-center rounded-full bg-[#7c5cff]/15 text-center shadow-[0_0_50px_rgba(124,92,255,.22)]"><span><strong className="block font-display text-2xl">6</strong><small className="text-[9px] uppercase text-[#a8b0c5]">lenses</small></span></div></div><div className="mt-5 rounded-xl border border-[#35d49a]/15 bg-[#35d49a]/[.06] p-3 text-xs text-[#8eeac9]"><strong>Strongest next move:</strong> validate footfall before a lease.</div></div>
                  <div className="p-5 md:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold text-[#53e0ff]">SAMPLE ANALYSIS</p><h3 className="mt-2 text-2xl font-bold">Neighborhood bakery • Dhaka</h3></div><span className="rounded-full border border-[#fd5fb4]/25 bg-[#fd5fb4]/10 px-3 py-1 text-[10px] font-bold text-[#ff91ca]">DEMO DATA</span></div><div className="mt-7 grid gap-3 sm:grid-cols-2">{[{icon:MapPin,label:"PLACE",value:"Residential edge"},{icon:Banknote,label:"BUDGET",value:"Protect runway"},{icon:UsersRound,label:"CUSTOMER",value:"Families + offices"},{icon:CalendarDays,label:"TIMING",value:"Test for 6–8 weeks"}].map(({icon:Icon,label,value}) => <div key={label} className="rounded-xl border border-white/10 bg-white/[.035] p-4"><Icon size={17} className="text-[#8d77ff]" /><p className="mt-3 text-[9px] font-bold tracking-[.15em] text-[#737e99]">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div>)}</div><div className="mt-4 flex items-center justify-between rounded-xl border border-[#53e0ff]/15 bg-[#53e0ff]/[.05] p-4"><div><p className="text-[10px] font-bold uppercase tracking-wider text-[#6d7995]">Confidence status</p><p className="mt-1 text-sm font-bold">Needs local evidence</p></div><ScanSearch className="text-[#53e0ff]" /></div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Process */}
        <section id="how-it-works" className="section-pad relative scroll-mt-20">
          <div className="container-shell"><div className="max-w-2xl"><span className="eyebrow"><Zap size={15} /> From uncertainty to action</span><h2 className="mt-5 text-3xl font-extrabold md:text-5xl">A smarter first week starts here.</h2></div><div className="mt-14 grid gap-5 lg:grid-cols-3">{steps.map(({number,icon:Icon,title,text}) => <article key={number} className="group card relative min-h-72 overflow-hidden p-7 hover:-translate-y-1 hover:border-[#7c5cff]/35"><span className="absolute right-5 top-3 font-display text-6xl font-extrabold text-white/[.035]">{number}</span><span className="grid size-13 place-items-center rounded-2xl border border-[#7c5cff]/20 bg-[#7c5cff]/10 text-[#a28fff] group-hover:shadow-[0_0_35px_rgba(124,92,255,.22)]"><Icon size={24} /></span><p className="mt-9 text-xs font-bold tracking-[.16em] text-[#69748f]">STEP {number}</p><h3 className="mt-3 text-2xl font-bold">{title}</h3><p className="mt-4 text-[#a8b0c5]">{text}</p></article>)}</div></div>
        </section>

        {/* Trust & FAQs */}
        <section className="section-pad border-t border-white/10 bg-[#080c19]"><div className="container-shell grid gap-12 lg:grid-cols-[.9fr_1.1fr]"><div className="relative overflow-hidden rounded-[30px] border border-[#7c5cff]/25 bg-gradient-to-br from-[#171331] to-[#090d1c] p-8 md:p-11"><div className="glow-orb -right-24 -top-24 size-64 bg-[#7c5cff] opacity-30" /><ShieldCheck className="relative text-[#53e0ff]" size={38} /><h2 className="relative mt-7 text-3xl font-extrabold">Trust begins with knowing the limits.</h2><p className="relative mt-5 text-lg text-[#b2b9cc]">The prototype does not pretend demonstration data is market truth. It shows assumptions, uncertainties, and exactly what needs local verification.</p><div className="relative mt-8 grid gap-3">{["Every generated brief is labelled", "No guarantee language or invented proof", "Your idea is not sent to an AI yet"].map(item => <div key={item} className="flex gap-3 rounded-xl border border-white/10 bg-white/[.04] p-3 text-sm"><BadgeCheck className="mt-0.5 shrink-0 text-[#55e4b3]" size={18} />{item}</div>)}</div></div><div><span className="eyebrow">Questions before you begin</span><h2 className="mt-5 text-3xl font-extrabold md:text-4xl">Clear expectations. Better decisions.</h2><div className="mt-8 divide-y divide-white/10">{faqs.map(([question,answer]) => <details key={question} className="group py-4"><summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 font-display font-bold">{question}<ChevronDown className="shrink-0 text-[#7c5cff] transition-transform group-open:rotate-180" size={20} /></summary><p className="pb-2 pr-8 text-[#a8b0c5]">{answer}</p></details>)}</div></div></div></section>

        <section className="relative overflow-hidden py-24"><div className="glow-orb left-1/4 top-1/2 size-[400px] bg-[#613ce3]" /><div className="container-shell relative"><div className="glass overflow-hidden rounded-[34px] px-6 py-16 text-center md:px-14"><div className="noise-layer pointer-events-none absolute inset-0 opacity-[.08]" /><div className="relative mx-auto max-w-3xl"><span className="eyebrow"><Lightbulb size={15} /> The idea is only the beginning</span><h2 className="mt-5 text-4xl font-extrabold md:text-6xl">Make your next move <span className="gradient-text">evidence-led.</span></h2><p className="mx-auto mt-6 max-w-xl text-lg text-[#a8b0c5]">Seven focused questions. One practical starting brief. Zero false promises.</p><Link href="/advisor" className="btn-primary mt-9">Analyze my business idea <ArrowRight size={18} /></Link></div></div></div></section>
      </main>
      <footer className="border-t border-white/10 bg-[#050711] py-9"><div className="container-shell flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center"><Brand /><p className="max-w-xl text-sm text-[#818ba4]">Planning and research prototype. Not financial, legal, or investment advice.</p><p className="text-sm text-[#818ba4]">© 2026 BizGuide AI</p></div></footer>
    </>
  );
}

function Metric({value,label}:{value:string;label:string}) { return <div className="text-center"><strong className="font-display text-xl text-white md:text-2xl">{value}</strong><span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-[#727d98] md:text-xs">{label}</span></div>; }
