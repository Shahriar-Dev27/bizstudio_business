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

/** One supporting line per lens, in the same order as the stage 03 `details`. */
export const LENS_NOTES = [
  "Who buys first, and a cheap way to test demand before you build.",
  "Which neighborhood suits those customers, and what to check on a site visit.",
  "Cost assumptions and a working-capital buffer for the money you have.",
  "Suppliers, equipment, people, and the daily workflow.",
  "Seasonality, festivals, and the best time to start.",
  "What could go wrong, and what to verify with local authorities.",
] as const;

export type PlanTag = "Assumption" | "Verify locally";

/** One tag per stage 04 `details` item, in the same order. */
export const PLAN_TAGS: readonly PlanTag[] = ["Assumption", "Verify locally", "Assumption", "Verify locally"];

export const PLAN_TAG_MEANING: Record<PlanTag, string> = {
  Assumption: "a guess to test, not a fact",
  "Verify locally": "confirm with current local sources",
};

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
    details: ["Customers", "Location", "Budget", "Operations", "Timing", "Risks"],
  },
  {
    id: "process-plan",
    number: "04",
    title: "Choose a practical next move",
    description: "The discussion narrows into a small plan with prioritized next actions. Every sample step is labeled as an assumption or something to verify locally.",
    details: [
      "Test a preorder bakery pilot",
      "Obtain current supplier quotes",
      "Interview potential customers",
      "Estimate costs using verified inputs",
    ],
  },
  {
    id: "process-notes",
    number: "05",
    title: "Refine and keep what matters",
    description: "Ask a follow-up and the advice adapts. Pin the recommendations worth keeping so you can come back to them in the same browser.",
    details: [FOLLOW_UP, PINNED_RECOMMENDATION],
  },
];
