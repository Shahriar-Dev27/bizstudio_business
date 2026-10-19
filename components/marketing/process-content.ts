// Fixed, illustrative story for the "How it works" walkthrough (design spec section 6).
// Nothing here is produced by the advisor or fetched from anywhere.

export type ProcessStage = {
  id: string;
  number: string;
  title: string;
  description: string;
  details: readonly string[];
};

export const SAMPLE_LABEL = "Illustrative example — not a live AI response.";
export const EXAMPLE_INPUT = "I want to open a bakery in Dhaka with ৳2 lakh.";
export const CONTEXT_CHIPS = ["Dhaka", "৳2 lakh"] as const;
export const FOLLOW_UP = "What if I start from home?";
export const PINNED_RECOMMENDATION = "Test demand with preorders before committing to a shop lease.";
export const FINAL_ACTION_LABEL = "Start with your own idea";

/** Short node names, in order: the full connected process shown at the final stage. */
export const PROCESS_FLOW = ["Your idea", "Your context", "Business lenses", "Practical next steps", "Refine + save"] as const;

/**
 * Stage 03 lenses. Name, supporting line, and (in the diagram) icon travel together, so a lens can
 * never be paired with another lens's note. The stage `details` below are derived from this list.
 */
export const LENSES = [
  { name: "Customers", note: "Who buys first, and a cheap way to test demand before you build." },
  { name: "Location", note: "Which neighborhood suits those customers, and what to check on a site visit." },
  { name: "Budget", note: "Cost assumptions and a working-capital buffer for the money you have." },
  { name: "Operations", note: "Suppliers, equipment, people, and the daily workflow." },
  { name: "Timing", note: "Seasonality, festivals, and the best time to start." },
  { name: "Risks", note: "What could go wrong, and what to verify with local authorities." },
] as const;

export type LensName = (typeof LENSES)[number]["name"];

/** The label says what the step does with the claim: put a guess to the test, or confirm a fact locally. */
export type PlanTag = "Assumption to test" | "Verify locally";

export const PLAN_TAG_MEANING: Record<PlanTag, string> = {
  "Assumption to test": "a guess this step puts to the test, not a fact",
  "Verify locally": "confirm with current local sources",
};

/** Stage 04 sample plan. Each step carries its own tag; `details` below is derived from this list. */
export const PLAN_STEPS: readonly { label: string; tag: PlanTag }[] = [
  { label: "Test a preorder bakery pilot", tag: "Assumption to test" },
  { label: "Obtain current supplier quotes", tag: "Verify locally" },
  { label: "Interview potential customers", tag: "Assumption to test" },
  { label: "Estimate costs using verified inputs", tag: "Verify locally" },
];

export const PROCESS_STAGES: readonly ProcessStage[] = [
  {
    id: "process-idea",
    number: "01",
    title: "Share your idea",
    description: "Describe what you have in mind in everyday language. English, Bangla, or Banglish all work, and a rough sentence is enough to start.",
    details: [EXAMPLE_INPUT],
  },
  {
    id: "process-context",
    number: "02",
    title: "Add your context",
    description: "When a missing detail would change the advice, the advisor asks one to three focused questions. Your answers become context that stays in view.",
    details: ["Which neighborhood?", "Who will buy?", "What experience do you have?"],
  },
  {
    id: "process-analysis",
    number: "03",
    title: "Explore the business",
    description: "The idea is examined through six lenses. Expect demand tests, cost assumptions, supplier and setup questions, seasonality, and clear notes on what you must verify yourself.",
    details: LENSES.map((lens) => lens.name),
  },
  {
    id: "process-plan",
    number: "04",
    title: "Choose a practical next move",
    description: "The discussion narrows into a small plan with prioritized next actions. Every sample step is labeled as an assumption to test or something to verify locally.",
    details: PLAN_STEPS.map((step) => step.label),
  },
  {
    id: "process-notes",
    number: "05",
    title: "Refine and keep what matters",
    description: "Ask a follow-up and the advice adapts. Pin the recommendations worth keeping so you can come back to them in the same browser.",
    details: [FOLLOW_UP, PINNED_RECOMMENDATION],
  },
];
