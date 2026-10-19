import type { ChatMessage } from "./advisor";
export type MessageStatus =
  "pending" | "streaming" | "complete" | "interrupted" | "failed" | "truncated";
export type AnswerMode = "concise" | "detail" | "roadmap";
export type ReasoningMode = "auto" | "quick" | "deep";
export type Locale = "en" | "bn";
export type WireMessage = { role: "user" | "assistant"; content: string };
export type BusinessBrief = {
  idea?: string;
  location?: string;
  budgetBdt?: number;
  experience?: string;
  stage?: string;
  language?: "en" | "bn" | "banglish";
};
export type AdvisorRequest = {
  version: 1;
  conversationId: string;
  turnId: string;
  attemptId: string;
  messages: WireMessage[];
  profile?: BusinessBrief;
  mode: AnswerMode;
  reasoning: ReasoningMode;
};
export type ChatErrorCode =
  | "invalid_request"
  | "payload_too_large"
  | "not_configured"
  | "rate_limited"
  | "budget_exhausted"
  | "provider_unavailable"
  | "provider_timeout"
  | "protocol_error"
  | "cancelled";
type Correlation = { requestId: string; attemptId: string };
export type ChatEvent = Correlation &
  (
    | { type: "start" }
    | { type: "progress"; phase: "thinking" | "typing" }
    | { type: "delta"; text: string }
    | { type: "finish"; reason: "stop" | "length"; generatedTokens?: number }
    | { type: "error"; code: ChatErrorCode; retryable: boolean }
  );
export type AttemptSnapshot = {
  attemptId: string;
  content: string;
  status: MessageStatus;
  createdAt: number;
};
export type SavedConversation = {
  schemaVersion: 1;
  id: string;
  title: string;
  updatedAt: number;
  messages: ChatMessage[];
  draft: string;
  profile: BusinessBrief;
  completedSteps: Record<string, boolean>;
  locale: Locale;
  revision?: string;
};
export type ChatState = SavedConversation & {
  phase: "idle" | "thinking" | "typing";
  activeAttemptId: string | null;
  error: string;
  requestId?: string;
};
export type ChatAction =
  | { type: "draft"; value: string }
  | { type: "profile"; value: BusinessBrief }
  | { type: "locale"; value: Locale }
  | { type: "start"; user: ChatMessage; assistant: ChatMessage; retry: boolean }
  | { type: "event"; conversationId: string; event: ChatEvent }
  | {
      type: "end";
      conversationId: string;
      attemptId: string;
      status: MessageStatus;
      error?: string;
    }
  | { type: "replace"; value: SavedConversation }
  | { type: "steps"; key: string; done: boolean };
export type RoadmapStep = {
  id: string;
  title: string;
  action: string;
  deliverable: string;
  check: string;
  timing: string;
  dependsOn: string[];
};
export type Roadmap = { title: string; steps: RoadmapStep[] };
