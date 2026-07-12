import type { AdvisorQuestion, AdvisorService, AnalysisReport, BusinessProfile } from "@/types/advisor";

export const advisorQuestions: AdvisorQuestion[] = [
  { id: "idea", prompt: "What business are you thinking about?", helper: "A simple description is enough—we will shape it together.", inputType: "text", placeholder: "I want to open a small bakery...", minimumLength: 4 },
  { id: "category", prompt: "Which category fits it best?", helper: "This helps us frame typical setup needs and market questions.", inputType: "choices", choices: ["Food & beverage", "Retail", "Online business", "Services", "Agriculture", "Manufacturing", "Other"] },
  { id: "location", prompt: "Where in Bangladesh would you like to start?", helper: "Choose a city or enter a district, upazila, or neighborhood.", inputType: "choices", choices: ["Dhaka", "Chattogram", "Sylhet", "Rajshahi", "Khulna", "Cumilla", "Other location"] },
  { id: "budget", prompt: "What budget range feels realistic?", helper: "Use the amount you could responsibly prepare—not the maximum you could borrow.", inputType: "choices", choices: ["Under ৳1 lakh", "৳1–3 lakh", "৳3–8 lakh", "৳8–20 lakh", "Above ৳20 lakh", "Not sure yet"] },
  { id: "experience", prompt: "How familiar are you with this kind of work?", helper: "Your experience changes how much testing, training, and outside support may be needed.", inputType: "choices", choices: ["Completely new", "Some personal experience", "Worked in the industry", "Already run a business"] },
  { id: "customers", prompt: "Who do you expect will buy from you?", helper: "Describe the people, businesses, or community you want to serve.", inputType: "text", placeholder: "Office workers and families nearby...", minimumLength: 3 },
  { id: "timeline", prompt: "When would you ideally like to launch?", helper: "A target helps us make the preparation sequence more useful.", inputType: "choices", choices: ["Within 1 month", "In 2–3 months", "In 4–6 months", "Later this year", "Still exploring"] },
];

function budgetFocus(budget: string) {
  if (budget.includes("Under") || budget.includes("1–3")) return ["Begin with a low-fixed-cost pilot, shared space, preorder model, or online-first version.", "Keep at least 25–30% uncommitted for working capital and unexpected setup costs.", "Avoid a long lease until repeat demand has been tested."];
  if (budget.includes("3–8")) return ["Separate equipment, fit-out, inventory, permits, marketing, and three months of operating cash.", "Compare a compact physical setup with a delivery-first or appointment model.", "Request three written supplier quotations before fixing the budget."];
  return ["Build a staged capital plan with approval points before each major purchase.", "Model six months of operating cash separately from fit-out and equipment.", "Use written quotations and professional review for lease, compliance, and financing commitments."];
}

function locationLens(location: string, category: string) {
  const city = location === "Other location" ? "your selected area" : location;
  if (category === "Online business") return [`Base operations in ${city} where delivery coverage, courier access, staffing, and storage are manageable.`, "A premium storefront may add cost without improving online demand.", "Compare delivery time and return handling across at least two courier options."];
  if (category === "Food & beverage" || category === "Retail") return [`Shortlist mixed residential-commercial pockets in ${city} with visible, repeat footfall.`, "Compare rent, frontage, parking or rickshaw access, utilities, and nearby substitutes—not rent alone.", "Count relevant footfall at morning, midday, and evening on both a weekday and weekend."];
  return [`Choose a base in ${city} that balances customer access, supplier reach, and affordable fixed costs.`, "Map five direct or indirect competitors within the practical customer radius.", "Validate utilities, transport, staffing, and local operating constraints before signing a lease."];
}

function seasonLens(category: string, timeline: string) {
  if (category === "Agriculture") return ["Align launch timing with the specific crop, input, or procurement cycle; verify locally before committing inventory.", "Use the requested launch window for interviews and a small test if it misses the natural demand cycle.", `Your current target is “${timeline}”; work backward from supplier lead times and field validation.`];
  if (category === "Food & beverage" || category === "Retail") return ["Demand may shift around Ramadan, Eid, Puja, school calendars, monsoon conditions, and year-end events.", "Launch a soft opening two to four weeks before a major demand period rather than on the busiest day.", `For “${timeline},” reserve at least two weeks for testing suppliers, pricing, and service flow.`];
  return ["Check whether weather, school calendars, religious festivals, procurement cycles, or financial year timing affects customers.", "Prefer a small controlled launch before a heavy marketing push.", `Use “${timeline}” as a working target and revise it when local evidence is collected.`];
}

function buildReport(profile: BusinessProfile): AnalysisReport {
  const ideaLabel = profile.idea.length > 62 ? `${profile.idea.slice(0, 59)}…` : profile.idea;
  return {
    title: `${ideaLabel} — first planning brief`,
    summary: `A ${profile.category.toLowerCase()} concept aimed at ${profile.customers.toLowerCase()} in ${profile.location}. The strongest first move is to validate demand and operating constraints before committing most of the ${profile.budget.toLowerCase()} budget.`,
    assumptions: [`Location entered: ${profile.location}`, `Budget range: ${profile.budget}`, `Experience level: ${profile.experience}`, `Preferred launch: ${profile.timeline}`],
    locationAnalysis: { title: "Place & setup lens", items: locationLens(profile.location, profile.category) },
    budget: { title: "Budget limits", items: budgetFocus(profile.budget) },
    requirements: { title: "What you may need", items: ["A one-page offer: customer, problem, product or service, price, and reason to choose you.", "A basic setup list covering space, equipment, utilities, suppliers, staffing, payments, delivery, and record keeping.", "Separate personal and business cash; track every setup and operating cost from day one.", "Confirm applicable trade licence, tax, food safety, environmental, sector, or local authority requirements."] },
    launchSteps: { title: "Step-by-step launch", items: ["Interview 10–15 target customers and document their current alternatives.", "Visit at least three possible locations or operating models and score them consistently.", "Build a minimum pilot with a clear spending cap and success measure.", "Run the pilot, record demand and delivery problems, then adjust the offer and price.", "Commit to the larger setup only if evidence meets your predefined threshold."] },
    seasonality: { title: "Season & timing", items: seasonLens(profile.category, profile.timeline) },
    marketConsiderations: { title: "Market & competition", items: [`Define “${profile.customers}” more narrowly by location, need, buying frequency, and price sensitivity.`, "Compare five alternatives on price, convenience, quality, trust, and availability.", "Test three prices with real prospects; stated interest without a purchase or deposit is weak evidence.", "Estimate break-even using conservative sales, realistic waste or returns, and full owner time."] },
    verification: { title: "Legal & operational checks", items: ["Confirm requirements with the relevant city corporation, municipality, union parishad, tax office, or sector authority.", "Have leases, loans, partnerships, and major supplier agreements reviewed before signing.", "Verify electricity, water, internet, waste, fire safety, access, and delivery conditions at the exact site."] },
    risks: { title: "Risks & limitations", items: ["This report uses deterministic demonstration logic, not live market, rent, competitor, or regulatory data.", "Costs and rules can differ by district, business structure, building, and operating model.", "A positive plan is not a prediction of profitability or success."] },
    nextActions: { title: "Your next 7 days", items: ["Write down three assumptions that would make the idea fail if they are wrong.", "Speak with five target customers and two experienced operators or suppliers.", "Compare two locations or operating models using the same cost and access checklist.", "Update the plan with evidence and decide whether to test, change, or pause the idea."] },
  };
}

// Mock adapter boundary: a future server-only OpenRouter service can implement the same interface.
export const mockAdvisorService: AdvisorService = {
  async analyze(profile: BusinessProfile) {
    await new Promise((resolve) => setTimeout(resolve, 850));
    return buildReport(profile);
  },
};
