import { expect, it } from "vitest";
import {
  extractRoadmap,
  isRoadmapRequest,
  validateRoadmap,
} from "@/lib/chat/roadmap";
const steps = ["research", "pilot", "launch"].map((id, i) => ({
  id,
  title: ["Research customers", "Run a small pilot", "Launch carefully"][i],
  action: "Interview five target customers.",
  deliverable: "Five recorded responses",
  check: "Five interviews completed",
  timing: "Week 1",
  dependsOn: i ? [i === 1 ? "research" : "pilot"] : [],
}));
it("reads a validated business workflow without executing diagram code", () => {
  const result = extractRoadmap(
    "Here is your plan.\n```roadmap\n" +
      JSON.stringify({ title: "Snack business", steps }) +
      "\n```",
  );
  expect(result.roadmap?.steps).toHaveLength(3);
  expect(result.prose).toContain("Here is your plan.");
  expect(result.prose).not.toContain("```roadmap");
});
it.each(["json", "", "JSON"])(
  "extracts a roadmap from a %s code block instead of exposing JSON",
  (language) => {
    const result = extractRoadmap(
      `Validate demand first.\n\n\`\`\`${language}\n` +
        JSON.stringify({ title: "Sylhet Coffee Shop Launch Roadmap", steps }) +
        "\n```\n\nStart with customer interviews.",
    );
    expect(result.roadmap?.title).toBe("Sylhet Coffee Shop Launch Roadmap");
    expect(result.roadmap?.steps).toHaveLength(3);
    expect(result.prose).toBe(
      "Validate demand first.\n\n\n\nStart with customer interviews.",
    );
    expect(result.invalid).toBe(false);
  },
);
it("renders a response containing only a roadmap JSON object", () => {
  const result = extractRoadmap(JSON.stringify({ title: "Coffee launch", steps }));
  expect(result.roadmap?.title).toBe("Coffee launch");
  expect(result.prose).toBe("");
});
it("preserves unrelated code blocks before and after a roadmap", () => {
  const before = '```json\n{"example":true}\n```\n\n';
  const after = '\n\n```js\nconst steps = [];\n```';
  const result = extractRoadmap(
    before +
      "```json\n" +
      JSON.stringify({ title: "Plan", steps }) +
      "\n```" +
      after,
  );
  expect(result.roadmap?.steps).toHaveLength(3);
  expect(result.prose).toBe((before + after).trim());
});
it.each([
  '{"example":true}',
  '{"title":"Invalid roadmap","steps":[]}',
  JSON.stringify({
    title: "Invalid dependencies",
    steps: [steps[0], { ...steps[1], dependsOn: ["unknown"] }, steps[2]],
  }),
  "not valid JSON",
])("does not convert ordinary or invalid JSON into a diagram: %s", (json) => {
  const content = "```json\n" + json + "\n```";
  expect(extractRoadmap(content)).toEqual({
    prose: content,
    roadmap: null,
    invalid: false,
  });
});
it("rejects cycles, unknown references, repeated IDs and oversized steps", () => {
  expect(
    validateRoadmap({
      title: "Plan",
      steps: [{ ...steps[0], dependsOn: ["launch"] }, ...steps.slice(1)],
    }),
  ).toBeNull();
  expect(
    validateRoadmap({
      title: "Plan",
      steps: [steps[0], { ...steps[1], dependsOn: ["unknown"] }, steps[2]],
    }),
  ).toBeNull();
  expect(
    validateRoadmap({ title: "Plan", steps: [steps[0], steps[0], steps[2]] }),
  ).toBeNull();
  expect(
    validateRoadmap({
      title: "Plan",
      steps: [{ ...steps[0], action: "x".repeat(501) }, ...steps.slice(1)],
    }),
  ).toBeNull();
});
it("recognizes English, Bangla and Banglish roadmap intent", () => {
  for (const text of [
    "Give a roadmap",
    "ব্যবসার রোডম্যাপ দিন",
    "amar business er roadmap dao",
    "show the workflow",
    "ধাপে ধাপে পরিকল্পনা",
  ])
    expect(isRoadmapRequest(text)).toBe(true);
  expect(isRoadmapRequest("Hello")).toBe(false);
});
it("keeps readable fallback text if roadmap data is invalid", () => {
  const result = extractRoadmap('Plan\n```roadmap\n{"steps":[]}\n```');
  expect(result.roadmap).toBeNull();
  expect(result.invalid).toBe(true);
  expect(result.prose).toContain("Plan");
});
