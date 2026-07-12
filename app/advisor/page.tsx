import { Suspense } from "react";
import { AdvisorExperience } from "@/components/advisor-experience";

export default function AdvisorPage() {
  return <Suspense fallback={<div className="grid min-h-dvh place-items-center bg-[#f8f6ff] text-sm font-semibold text-[#68647a]">Loading the planning workspace…</div>}><AdvisorExperience /></Suspense>;
}
