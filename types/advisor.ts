export type BusinessProfile = {
  idea: string;
  category: string;
  location: string;
  budget: string;
  experience: string;
  customers: string;
  timeline: string;
};

export type ProfileKey = keyof BusinessProfile;
export type AdvisorQuestion = {
  id: ProfileKey;
  prompt: string;
  helper: string;
  inputType: "text" | "choices";
  placeholder?: string;
  choices?: string[];
  minimumLength?: number;
};

export type AdvisorMessage = {
  id: string;
  sender: "advisor" | "user";
  content: string;
  timestamp: number;
  status?: "sent" | "thinking";
  quickActions?: string[];
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  streaming?: boolean;
};

export type PinnedNote = {
  id: string;
  text: string;
  sourceMessageId?: string;
  createdAt: number;
};

export type ReportSection = { title: string; items: string[] };
export type AnalysisReport = {
  title: string;
  summary: string;
  assumptions: string[];
  locationAnalysis: ReportSection;
  budget: ReportSection;
  requirements: ReportSection;
  launchSteps: ReportSection;
  seasonality: ReportSection;
  marketConsiderations: ReportSection;
  verification: ReportSection;
  risks: ReportSection;
  nextActions: ReportSection;
};

export interface AdvisorService {
  analyze(profile: BusinessProfile): Promise<AnalysisReport>;
}
