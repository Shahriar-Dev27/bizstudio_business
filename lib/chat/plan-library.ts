import type { SavedConversation } from "@/types/chat";
import type { PinnedNote } from "@/types/advisor";
import {
  getStorage,
  readStorage,
  writeStorage,
  parseSavedConversation,
  LIBRARY_KEY,
  type StorageResult,
} from "./storage";
import { extractRoadmap } from "./roadmap";
type DeviceStorage = Pick<Storage, "getItem" | "setItem">;
export type DevicePlan = SavedConversation & { archived?: boolean };
export function listDevicePlans(
  storage: DeviceStorage | null = getStorage("localStorage"),
): DevicePlan[] {
  const raw = readStorage(storage, LIBRARY_KEY);
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v): DevicePlan | null => {
      const parsed = parseSavedConversation(v);
      return parsed ? { ...parsed, archived: v.archived === true } : null;
    })
    .filter((v): v is DevicePlan => v !== null)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}
export function saveDevicePlan(
  plan: DevicePlan,
  storage: DeviceStorage | null = getStorage("localStorage"),
): StorageResult & { plan?: DevicePlan } {
  if (!parseSavedConversation(plan)) return { ok: false, reason: "invalid" };
  if (plan.messages.length > 100) return { ok: false, reason: "limit" };
  const plans = listDevicePlans(storage),
    existing = plans.find((p) => p.id === plan.id);
  if (existing && existing.revision !== plan.revision)
    return { ok: false, reason: "conflict" };
  if (!existing && plans.length >= 10) return { ok: false, reason: "limit" };
  const saved = {
    ...plan,
    updatedAt: Date.now(),
    revision: crypto.randomUUID(),
  };
  const result = writeStorage(storage, LIBRARY_KEY, [
    saved,
    ...plans.filter((p) => p.id !== plan.id),
  ]);
  return { ...result, ...(result.ok ? { plan: saved } : {}) };
}
export function deleteDevicePlan(
  id: string,
  storage: DeviceStorage | null = getStorage("localStorage"),
) {
  return writeStorage(
    storage,
    LIBRARY_KEY,
    listDevicePlans(storage).filter((p) => p.id !== id),
  );
}
export function exportPlanMarkdown(
  plan: SavedConversation,
  notes: PinnedNote[],
): string {
  const lines = [
    `# ${plan.title}`,
    "",
    "User-provided business brief",
    JSON.stringify(plan.profile, null, 2),
    "",
    "Generated advice may include assumptions and illustrative estimates. Verify important details locally.",
    "",
  ];
  for (const m of plan.messages) {
    if (m.welcome) continue;
    const extracted = extractRoadmap(m.content);
    lines.push(
      `## ${m.role === "user" ? "Question" : "Advisor"} (${m.status || "complete"})`,
      extracted.prose,
      "",
    );
    if (extracted.roadmap) {
      lines.push(`### ${extracted.roadmap.title}`);
      extracted.roadmap.steps.forEach((s, i) =>
        lines.push(
          `${i + 1}. [${plan.completedSteps[`${m.id}:${s.id}`] ? "x" : " "}] ${s.title} — ${s.timing}`,
          `   Action: ${s.action}`,
          `   Deliverable: ${s.deliverable}`,
          `   Done when: ${s.check}`,
          `   Depends on: ${s.dependsOn.join(", ") || "none"}`,
          "",
        ),
      );
    }
  }
  lines.push("## Selected notes");
  for (const note of notes.filter((n) => n.conversationId === plan.id))
    lines.push(
      `- ${note.text} (source: ${note.sourceMessageId || "personal note"})`,
    );
  return lines.join("\n");
}
export function downloadPlan(plan: SavedConversation, notes: PinnedNote[]) {
  const blob = new Blob([exportPlanMarkdown(plan, notes)], {
      type: "text/markdown;charset=utf-8",
    }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = `bizguide-${plan.id.slice(0, 8)}.md`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
