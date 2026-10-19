export type ChatMetric = {
  requestId: string;
  model: string;
  mode: string;
  outcome: string;
  durationMs: number;
  firstContentMs?: number;
  generatedTokens?: number;
  code?: string;
};
export function recordChatMetric(metric: ChatMetric) {
  const {
    requestId,
    model,
    mode,
    outcome,
    durationMs,
    firstContentMs,
    generatedTokens,
    code,
  } = metric;
  console.info(
    JSON.stringify({
      event: "advisor_generation",
      requestId,
      model,
      mode,
      outcome,
      durationMs,
      firstContentMs,
      generatedTokens,
      code,
    }),
  );
}
