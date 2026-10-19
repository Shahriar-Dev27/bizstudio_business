import type { ChatErrorCode } from "@/types/chat";
export const ERROR_MESSAGES: Record<ChatErrorCode, string> = {
  invalid_request: "Please check your question and try again.",
  payload_too_large:
    "This conversation is too large to send. Start a new plan or shorten the question.",
  not_configured: "The advisor is not available yet. Please try again later.",
  rate_limited: "Please wait a moment before asking again.",
  budget_exhausted:
    "The advisor has reached today's usage limit. Please return later.",
  provider_unavailable:
    "The advisor connection was interrupted. Your progress is still here.",
  provider_timeout:
    "This reply is taking longer than expected. Your progress is saved; you can retry.",
  protocol_error:
    "The reply did not finish correctly. Your partial answer is still here.",
  cancelled: "Reply stopped. Your partial answer is kept.",
};
export class ChatError extends Error {
  constructor(
    public code: ChatErrorCode,
    public status = 400,
    public retryAfterSeconds?: number,
  ) {
    super(ERROR_MESSAGES[code]);
    this.name = "ChatError";
  }
}
