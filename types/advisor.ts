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

export type AnalysisSection = {
  title: string;
  items: string[];
};

export type AnalysisReport = {
  title: string;
  summary: string;
  assumptions: string[];
  locationAnalysis: AnalysisSection;
  budget: AnalysisSection;
  requirements: AnalysisSection;
  launchSteps: AnalysisSection;
  seasonality: AnalysisSection;
  marketConsiderations: AnalysisSection;
  verification: AnalysisSection;
  risks: AnalysisSection;
  nextActions: AnalysisSection;
};
