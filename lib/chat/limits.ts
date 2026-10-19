export const LIMITS = {
  requestBytes: 128 * 1024,
  userChars: 4000,
  assistantChars: 12000,
  historyChars: 60000,
  historyMessages: 24,
  profileChars: 2048,
  notes: 60,
  noteChars: 500,
  devicePlans: 10,
  planMessages: 100,
} as const;
export const encodedBytes = (value: unknown) =>
  new TextEncoder().encode(JSON.stringify(value)).byteLength;
