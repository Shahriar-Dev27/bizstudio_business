import type { ChatAction, ChatState, SavedConversation } from "@/types/chat";
import { ADVISOR_WELCOME } from "@/lib/advisor-prompt";
import { ERROR_MESSAGES } from "./errors";
export function createConversation(
  locale: "en" | "bn" = "en",
): SavedConversation {
  return {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    title: locale === "bn" ? "নতুন ব্যবসার পরিকল্পনা" : "New business plan",
    updatedAt: Date.now(),
    messages: [
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          locale === "bn"
            ? "আসসালামু আলাইকুম! আপনার ব্যবসার ধারণা, এলাকা ও বাজেট বলুন। আমরা একটি বাস্তবসম্মত প্রথম পদক্ষেপ ঠিক করব।"
            : ADVISOR_WELCOME,
        createdAt: Date.now(),
        status: "complete",
        welcome: true,
      },
    ],
    draft: "",
    profile: {},
    completedSteps: {},
    locale,
  };
}
export const initialChatState = (): ChatState => ({
  ...createConversation(),
  phase: "idle",
  activeAttemptId: null,
  error: "",
});
export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  if (action.type === "replace")
    return { ...action.value, phase: "idle", activeAttemptId: null, error: "" };
  if (action.type === "draft") return { ...state, draft: action.value };
  if (action.type === "profile")
    return { ...state, profile: action.value, updatedAt: Date.now() };
  if (action.type === "locale") return { ...state, locale: action.value };
  if (action.type === "steps")
    return {
      ...state,
      completedSteps: { ...state.completedSteps, [action.key]: action.done },
      updatedAt: Date.now(),
    };
  if (action.type === "start") {
    let messages = state.messages;
    if (action.retry) {
      messages = messages.map((m) =>
        m.role === "assistant" && m.turnId === action.user.turnId
          ? {
              ...action.assistant,
              id: m.id,
              attempts: [
                ...(m.attempts || []),
                ...(m.content
                  ? [
                      {
                        attemptId: m.attemptId || m.id,
                        content: m.content,
                        status: m.status || ("interrupted" as const),
                        createdAt: m.createdAt,
                      },
                    ]
                  : []),
              ].slice(-5),
            }
          : m,
      );
    } else messages = [...messages, action.user, action.assistant];
    return {
      ...state,
      messages,
      draft: "",
      title:
        state.messages.length <= 1
          ? action.user.content.slice(0, 70)
          : state.title,
      phase: "thinking",
      activeAttemptId: action.assistant.attemptId || null,
      error: "",
      updatedAt: Date.now(),
    };
  }
  if (action.conversationId !== state.id) return state;
  const attempt =
    action.type === "event" ? action.event.attemptId : action.attemptId;
  if (attempt !== state.activeAttemptId) return state;
  if (action.type === "end")
    return {
      ...state,
      phase: "idle",
      activeAttemptId: null,
      error: action.error || "",
      messages: state.messages.map((m) =>
        m.attemptId === attempt
          ? {
              ...m,
              status: action.status,
              streaming: false,
              error: action.error,
            }
          : m,
      ),
      updatedAt: Date.now(),
    };
  const event = action.event;
  if (event.type === "start") return { ...state, requestId: event.requestId };
  if (event.type === "progress")
    return { ...state, phase: event.phase, requestId: event.requestId };
  if (event.type === "delta")
    return {
      ...state,
      phase: "typing",
      messages: state.messages.map((m) =>
        m.attemptId === attempt
          ? {
              ...m,
              content: (m.content + event.text).slice(0, 24000),
              status: "streaming",
              streaming: true,
            }
          : m,
      ),
    };
  if (event.type === "finish")
    return {
      ...state,
      phase: "idle",
      activeAttemptId: null,
      messages: state.messages.map((m) =>
        m.attemptId === attempt
          ? {
              ...m,
              status: event.reason === "length" ? "truncated" : "complete",
              streaming: false,
            }
          : m,
      ),
      updatedAt: Date.now(),
    };
  return chatReducer(state, {
    type: "end",
    conversationId: state.id,
    attemptId: attempt!,
    status: "interrupted",
    error: ERROR_MESSAGES[event.code],
  });
}
