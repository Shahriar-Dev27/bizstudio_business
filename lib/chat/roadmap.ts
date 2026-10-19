import type { Roadmap, RoadmapStep } from "@/types/chat";
export function isRoadmapRequest(text: string) {
  return /road\s?map|workflow|step.by.step|launch plan|রোডম্যাপ|ধাপে\s*ধাপে|কর্মপরিকল্পনা|রূপরেখা|porikolpona|পরিকল্পনা.*ধাপ/i.test(
    text,
  );
}
export function validateRoadmap(value: unknown): Roadmap | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Roadmap;
  if (
    typeof v.title !== "string" ||
    !v.title.trim() ||
    v.title.length > 120 ||
    !Array.isArray(v.steps) ||
    v.steps.length < 3 ||
    v.steps.length > 8
  )
    return null;
  const ids = new Set<string>();
  for (const step of v.steps) {
    if (
      !step ||
      typeof step !== "object" ||
      typeof step.id !== "string" ||
      !/^[a-zA-Z0-9_-]{1,40}$/.test(step.id) ||
      ids.has(step.id)
    )
      return null;
    ids.add(step.id);
    for (const [key, max] of [
      ["title", 100],
      ["action", 500],
      ["deliverable", 240],
      ["check", 240],
      ["timing", 80],
    ] as const)
      if (
        typeof step[key] !== "string" ||
        !step[key].trim() ||
        step[key].length > max
      )
        return null;
    if (
      !Array.isArray(step.dependsOn) ||
      step.dependsOn.length > 8 ||
      step.dependsOn.some((d) => typeof d !== "string")
    )
      return null;
  }
  const visited = new Set<string>(),
    active = new Set<string>();
  const visit = (id: string): boolean => {
    if (active.has(id)) return false;
    if (visited.has(id)) return true;
    active.add(id);
    const s = v.steps.find((s) => s.id === id)!;
    for (const d of s.dependsOn) if (!ids.has(d) || !visit(d)) return false;
    active.delete(id);
    visited.add(id);
    return true;
  };
  if (!v.steps.every((s) => visit(s.id))) return null;
  const ordered: RoadmapStep[] = [],
    remaining = [...v.steps];
  while (remaining.length) {
    const index = remaining.findIndex((s) =>
      s.dependsOn.every((d) => ordered.some((o) => o.id === d)),
    );
    if (index < 0) return null;
    ordered.push(remaining.splice(index, 1)[0]);
  }
  return {
    title: v.title.trim(),
    steps: ordered.map((s) => ({
      id: s.id,
      title: s.title,
      action: s.action,
      deliverable: s.deliverable,
      check: s.check,
      timing: s.timing,
      dependsOn: [...new Set(s.dependsOn)],
    })),
  };
}
export function extractRoadmap(content: string): {
  prose: string;
  roadmap: Roadmap | null;
  invalid: boolean;
} {
  const match = /```roadmap\s*\n([\s\S]*?)```/i.exec(content);
  if (!match) return { prose: content, roadmap: null, invalid: false };
  let roadmap: Roadmap | null = null;
  try {
    if (match[1].length <= 18000)
      roadmap = validateRoadmap(JSON.parse(match[1]));
  } catch {
    /* Keep the prose alternative. */
  }
  return {
    prose: content.replace(match[0], "").trim(),
    roadmap,
    invalid: !roadmap,
  };
}
