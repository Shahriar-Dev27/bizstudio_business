import "./advisor.css";
import { Suspense } from "react";
import { paperArcadeFontVariables } from "@/app/paper-arcade-fonts";
import { AdvisorExperience } from "@/components/advisor-experience";

export default function AdvisorPage() {
  return (
    <div className={`advisor-page ${paperArcadeFontVariables}`}>
      <Suspense fallback={<p className="adv-loading" role="status">Loading the advisor workspace…</p>}>
        <AdvisorExperience />
      </Suspense>
    </div>
  );
}
