import { Suspense } from "react";
import { AdvisorExperience } from "@/components/advisor-experience";

export default function AdvisorPage() {
  return <Suspense fallback={<div className="grid min-h-dvh place-items-center bg-[#050816] text-sm font-semibold text-[#8f9ab2]">Loading the advisor workspace…</div>}><AdvisorExperience /></Suspense>;
}
