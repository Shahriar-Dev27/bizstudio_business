import type { BusinessBrief } from "@/types/chat";
import { ChatError } from "./errors";
export function validateBusinessBrief(value: unknown): BusinessBrief {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    JSON.stringify(value).length > 2048
  )
    throw new ChatError("invalid_request");
  const record = value as Record<string, unknown>,
    result: BusinessBrief = {};
  for (const key of ["idea", "location", "experience", "stage"] as const) {
    if (record[key] !== undefined) {
      if (typeof record[key] !== "string" || record[key].length > 500)
        throw new ChatError("invalid_request");
      result[key] = record[key].trim();
    }
  }
  if (record.budgetBdt !== undefined) {
    if (
      typeof record.budgetBdt !== "number" ||
      !Number.isFinite(record.budgetBdt) ||
      record.budgetBdt < 0 ||
      record.budgetBdt > 1e12
    )
      throw new ChatError("invalid_request");
    result.budgetBdt = record.budgetBdt;
  }
  if (record.language !== undefined) {
    if (!["en", "bn", "banglish"].includes(String(record.language)))
      throw new ChatError("invalid_request");
    result.language = record.language as BusinessBrief["language"];
  }
  return result;
}
