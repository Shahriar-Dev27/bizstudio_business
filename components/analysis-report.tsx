import { AlertTriangle, ArrowRight, Banknote, CalendarDays, CheckCircle2, ClipboardCheck, Compass, FileCheck2, MapPin, RotateCcw, Scale, ShieldCheck, Target } from "lucide-react";
import Link from "next/link";
import type { AnalysisReport as Report } from "@/types/advisor";

const iconMap = [MapPin, Banknote, ClipboardCheck, Target, CalendarDays, Compass, Scale, AlertTriangle, CheckCircle2];

export function AnalysisReport({ report, onRestart }: { report: Report; onRestart: () => void }) {
  const sections = [report.locationAnalysis, report.budget, report.requirements, report.launchSteps, report.seasonality, report.marketConsiderations, report.verification, report.risks, report.nextActions];
  return (
    <div className="mx-auto max-w-5xl pb-16">
      <div className="glass rounded-[28px] p-6 text-white shadow-[var(--shadow-lg)] md:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4"><span className="inline-flex items-center gap-2 rounded-full border border-[#53e0ff]/25 bg-[#53e0ff]/10 px-3 py-1.5 text-xs font-bold text-[#8decff]"><FileCheck2 size={15} /> DEMONSTRATION REPORT</span><span className="text-sm text-[#9ca7be]">Generated from your answers</span></div>
        <h1 className="mt-7 max-w-4xl text-3xl font-bold md:text-5xl">{report.title}</h1>
        <p className="mt-5 max-w-3xl text-lg text-[#bbc2d4]">{report.summary}</p>
        <div className="mt-7 flex flex-wrap gap-2">{report.assumptions.map((item) => <span key={item} className="rounded-full border border-white/12 bg-white/[.07] px-3 py-1.5 text-xs font-semibold text-[#ded9eb]">{item}</span>)}</div>
      </div>

      <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><div className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0" size={20} /><p><strong>Important:</strong> This is illustrative frontend demo content, not live market, legal, financial, or investment advice. Verify every material assumption locally before acting.</p></div></div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {sections.map((section, index) => { const Icon = iconMap[index]; return <section key={section.title} className={`card p-6 ${index === sections.length - 1 ? "md:col-span-2 !border-[#53e0ff]/25 !bg-[#53e0ff]/[.05]" : ""}`}><span className={`grid size-11 place-items-center rounded-xl ${index === 7 ? "bg-amber-400/10 text-amber-300" : index === 8 ? "bg-[#35d49a]/10 text-[#55e4b3]" : "bg-[#0891b2]/15 text-[#73e8ff]"}`}><Icon size={21} /></span><h2 className="mt-4 text-xl font-bold">{section.title}</h2><ul className="mt-4 grid gap-3">{section.items.map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-[#a8b0c5]"><CheckCircle2 className="mt-1 shrink-0 text-[#55e4b3]" size={16} aria-hidden="true" /><span>{item}</span></li>)}</ul></section>; })}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row"><button type="button" onClick={onRestart} className="btn-primary"><RotateCcw size={18} /> Plan another idea</button><Link href="/" className="btn-secondary">Back to homepage <ArrowRight size={18} /></Link></div>
    </div>
  );
}
