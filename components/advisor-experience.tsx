"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Bot, Check, RotateCcw, Send, Sparkles, UserRound } from "lucide-react";
import { FormEvent, useMemo, useRef, useState } from "react";
import { advisorQuestions, mockAdvisorService } from "@/lib/advisor-service";
import type { AnalysisReport as Report, BusinessProfile } from "@/types/advisor";
import { AnalysisReport } from "./analysis-report";
import { Brand } from "./brand";

type ProfileDraft = Partial<BusinessProfile>;

export function AdvisorExperience() {
  const searchParams = useSearchParams();
  const initialIdea = (searchParams.get("idea") || "").slice(0, 180);
  const [profile, setProfile] = useState<ProfileDraft>(initialIdea ? { idea: initialIdea } : {});
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(initialIdea);
  const [customDraft, setCustomDraft] = useState("");
  const [error, setError] = useState("");
  const [thinking, setThinking] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const question = advisorQuestions[step];
  const completed = useMemo(() => advisorQuestions.slice(0, step).filter((item) => profile[item.id]), [profile, step]);
  const progress = Math.round(((step + 1) / advisorQuestions.length) * 100);

  function choose(value: string) { setDraft(value); setCustomDraft(""); setError(""); }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const value = (customDraft.trim() || draft.trim());
    if (value.length < (question.minimumLength || 1)) { setError("Please add a little more detail before continuing."); return; }
    const nextProfile = { ...profile, [question.id]: value };
    setProfile(nextProfile);
    setError("");

    if (step === advisorQuestions.length - 1) {
      setThinking(true);
      const result = await mockAdvisorService.analyze(nextProfile as BusinessProfile);
      setReport(result);
      setThinking(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setThinking(true);
    timeoutRef.current = setTimeout(() => {
      const nextQuestion = advisorQuestions[step + 1];
      setStep((valueStep) => valueStep + 1);
      setDraft(nextProfile[nextQuestion.id] || "");
      setCustomDraft("");
      setThinking(false);
    }, 360);
  }

  function goBack() {
    if (thinking || step === 0) return;
    const previous = advisorQuestions[step - 1];
    setStep((value) => value - 1);
    setDraft(profile[previous.id] || "");
    setCustomDraft("");
    setError("");
  }

  function restart() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setProfile({}); setStep(0); setDraft(""); setCustomDraft(""); setError(""); setThinking(false); setReport(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (report) return <div className="container-shell pt-10"><AnalysisReport report={report} onRestart={restart} /></div>;

  return (
    <div className="soft-grid min-h-dvh bg-[#050816]">
      <header className="border-b border-white/10 bg-[#050816]/85 backdrop-blur"><div className="container-shell flex min-h-18 items-center justify-between gap-4"><Brand /><Link href="/" className="btn-secondary !min-h-11 !px-4"><ArrowLeft size={17} /> <span className="hidden sm:inline">Back home</span></Link></div></header>
      <main className="container-shell py-8 md:py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><span className="eyebrow"><Sparkles size={15} /> Guided planning demo</span><h1 className="mt-2 text-2xl font-bold md:text-3xl">Let&apos;s understand your idea.</h1></div><button type="button" onClick={restart} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-[#99a3ba] hover:bg-white/[.06] hover:text-[#53e0ff]"><RotateCcw size={17} /> Restart</button></div>

          <div className="mb-5" aria-label={`Step ${step + 1} of ${advisorQuestions.length}`}><div className="flex justify-between text-xs font-bold text-[#8b96af]"><span>QUESTION {step + 1} OF {advisorQuestions.length}</span><span>{progress}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[.08]"><div className="h-full rounded-full bg-gradient-to-r from-[#7c5cff] to-[#53e0ff] transition-[width] duration-300" style={{ width: `${progress}%` }} /></div></div>

          <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
            <aside className="glass hidden rounded-[24px] p-6 text-white lg:block">
              <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#53e0ff] to-[#7c5cff]"><Bot size={21} /></span><div><p className="font-display font-bold">BizGuide</p><p className="text-xs text-[#9ca7be]">Planning assistant • Demo</p></div></div>
              <div className="mt-8 grid gap-5">
                {completed.length === 0 && <p className="text-sm leading-6 text-[#9ca7be]">Your answers will appear here as we build a clearer picture of the idea.</p>}
                {completed.map((item) => <div key={item.id} className="border-l-2 border-[#53e0ff] pl-4"><p className="text-xs font-bold uppercase tracking-wide text-[#717d99]">{item.id}</p><p className="mt-1 text-sm text-white">{profile[item.id]}</p></div>)}
              </div>
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[.045] p-4 text-xs leading-5 text-[#9ca7be]">Your answers stay in this browser session. This frontend prototype does not save or send them to an AI service.</div>
            </aside>

            <section className="card min-h-[520px] p-5 md:p-8" aria-live="polite">
              <div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#7c5cff]/15 text-[#a28fff]"><Bot size={20} /></span><div className="max-w-[90%] rounded-2xl rounded-tl-sm border border-white/10 bg-white/[.045] px-4 py-3"><p className="font-semibold">{question.prompt}</p><p className="mt-1 text-sm text-[#9ca7be]">{question.helper}</p></div></div>

              {thinking ? <div className="mt-6 flex items-center gap-3 text-sm font-semibold text-[#9ca7be]"><span className="grid size-9 place-items-center rounded-xl bg-[#7c5cff]/15 text-[#a28fff]"><Bot size={17} /></span><span className="flex gap-1" aria-label="BizGuide is thinking"><i className="size-2 animate-bounce rounded-full bg-[#53e0ff] [animation-delay:-.2s]" /><i className="size-2 animate-bounce rounded-full bg-[#7c5cff] [animation-delay:-.1s]" /><i className="size-2 animate-bounce rounded-full bg-[#fd5fb4]" /></span>{step === advisorQuestions.length - 1 ? "Building your planning brief…" : "Preparing the next question…"}</div> : (
                <form onSubmit={submit} className="mt-8">
                  {question.inputType === "choices" ? <div className="grid gap-2 sm:grid-cols-2">{question.choices?.map((choice) => { const selected = draft === choice && !customDraft; return <button type="button" key={choice} onClick={() => choose(choice)} aria-pressed={selected} className={`flex min-h-13 items-center justify-between rounded-xl border px-4 text-left text-sm font-bold ${selected ? "border-[#53e0ff]/55 bg-[#53e0ff]/10 text-[#8decff] shadow-[0_0_0_1px_rgba(83,224,255,.25)]" : "border-white/10 bg-white/[.035] text-[#c6ccdc] hover:border-[#7c5cff]/45 hover:bg-[#7c5cff]/[.07]"}`}>{choice}{selected && <Check size={17} />}</button>; })}</div> : null}

                  {(question.inputType === "text" || question.id === "location" || question.id === "category") && <div className={question.inputType === "choices" ? "mt-5" : ""}><label htmlFor="answer" className="mb-2 block text-sm font-bold">{question.inputType === "choices" ? "Or type your own" : "Your answer"}</label><textarea id="answer" autoFocus value={question.inputType === "choices" ? customDraft : draft} onChange={(e) => { if (question.inputType === "choices") setCustomDraft(e.target.value); else setDraft(e.target.value); setError(""); }} maxLength={220} rows={3} placeholder={question.inputType === "choices" ? "Enter a specific answer…" : question.placeholder} className="w-full resize-none rounded-2xl border border-white/10 bg-[#070b17] px-4 py-3 text-base text-white outline-none placeholder:text-[#65708b] focus:border-[#53e0ff]/60 focus:shadow-[0_0_0_3px_rgba(83,224,255,.1)]" /></div>}

                  {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{error}</p>}
                  <div className="mt-7 flex items-center justify-between gap-3"><button type="button" onClick={goBack} disabled={step === 0} className="btn-secondary disabled:cursor-not-allowed disabled:opacity-40"><ArrowLeft size={18} /> Back</button><button type="submit" className="btn-primary" disabled={!draft.trim() && !customDraft.trim()}>{step === advisorQuestions.length - 1 ? "Create my brief" : "Continue"}{step === advisorQuestions.length - 1 ? <Send size={17} /> : <ArrowRight size={18} />}</button></div>
                </form>
              )}
              <div className="mt-8 flex items-center gap-2 border-t border-white/10 pt-5 text-xs text-[#79849f]"><UserRound size={15} /> You can go back and change any answer before generating the report.</div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
