export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  streaming?: boolean;
  turnId?: string;
  attemptId?: string;
  status?: import("./chat").MessageStatus;
  welcome?: boolean;
  attempts?: import("./chat").AttemptSnapshot[];
  error?: string;
};

export type PinnedNote = {
  id: string;
  text: string;
  sourceMessageId?: string;
  createdAt: number;
  conversationId?: string;
  kind?: "selection" | "step" | "personal";
};
