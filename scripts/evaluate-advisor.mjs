import { readFile, mkdir, writeFile } from "node:fs/promises";
const cases = JSON.parse(
  await readFile(
    new URL("../tests/evaluations/advisor-cases.json", import.meta.url),
    "utf8",
  ),
);
const base = process.env.ADVISOR_EVAL_BASE_URL || "http://localhost:3000";
const filter = process.env.ADVISOR_EVAL_CASES?.split(",");
let results = [];
if (process.env.ADVISOR_EVAL_FRESH !== "true") {
  try {
    results =
      JSON.parse(
        await readFile("docs/evaluations/advisor-live-results.json", "utf8"),
      ).results || [];
  } catch {
    /* First run. */
  }
}
function checksFor(test, text) {
  const checks = {
    nonempty: !!text.trim(),
    noReplacement: !text.includes("\ufffd"),
    noPromptLeak:
      !text.includes("RESPONSE DISCIPLINE") &&
      !text.includes("ROADMAP / WORKFLOW REQUESTS"),
  };
  for (const check of test.checks) {
    if (check === "bangla") checks.bangla = /[\u0980-\u09ff]/.test(text);
    else if (check === "math300") checks.math300 = /300|৩০০/.test(text);
    else if (check === "math1000")
      checks.math1000 = /1[,.]?000/.test(text) && /600/.test(text);
    else if (check === "budget70000")
      checks.budget70000 = /70[,.]?000/.test(text);
    else if (check === "sylhet") checks.sylhet = /Sylhet/i.test(text);
    else if (check === "rajshahi") checks.rajshahi = /Rajshahi/i.test(text);
    else if (check === "khulna") checks.khulna = /খুলনা/.test(text);
    else if (check === "roadmap") {
      try {
        const block = /\x60\x60\x60roadmap\s*\n([\s\S]*?)\x60\x60\x60/.exec(
          text,
        );
        checks.roadmap = !!block && JSON.parse(block[1]).steps.length >= 3;
      } catch {
        checks.roadmap = false;
      }
    } else if (check === "noInventedSource")
      checks.noInventedSource = !/https?:\/\//i.test(text);
    // Advisory judgment checks are recorded for human review, not automatically scored from keywords.
  }
  return checks;
}
for (const test of cases.filter((c) =>
  filter
    ? filter.includes(c.id)
    : !results.some(
        (r) =>
          r.id === c.id &&
          !r.error &&
          r.reason === "stop" &&
          Object.values(r.automatic).every(Boolean),
      ),
)) {
  const start = Date.now();
  let content = "",
    firstContentMs,
    reason,
    error;
  try {
    const attemptId = crypto.randomUUID();
    let response;
    for (let retry = 0; retry < 3; retry++) {
      response = await fetch(`${base}/api/advisor/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: 1,
          conversationId: crypto.randomUUID(),
          turnId: crypto.randomUUID(),
          attemptId,
          mode: test.mode || "concise",
          reasoning: "auto",
          profile: test.profile || {},
          messages: [{ role: "user", content: test.prompt }],
        }),
        signal: AbortSignal.timeout(200000),
      });
      if (response.status !== 429) break;
      await response.body?.cancel();
      await new Promise((resolve) => setTimeout(resolve, 30000));
    }
    if (!response?.ok) throw Error(`HTTP ${response?.status}`);
    if (response.status === 202)
      throw Error(
        "Use the local streaming route for this evaluation; deployed jobs require a session-aware runner.",
      );
    const decoder = new TextDecoder();
    let buffer = "";
    for await (const bytes of response.body) {
      buffer += decoder.decode(bytes, { stream: true });
      const frames = buffer.split(/\r?\n\r?\n/);
      buffer = frames.pop() || "";
      for (const frame of frames) {
        const data = frame
          .split(/\r?\n/)
          .filter((l) => l.startsWith("data:"))
          .map((l) => l.slice(5).trim())
          .join("\n");
        if (!data) continue;
        const event = JSON.parse(data);
        if (event.type === "delta") {
          firstContentMs ??= Date.now() - start;
          content += event.text;
        }
        if (event.type === "finish") reason = event.reason;
        if (event.type === "error") error = event.code;
      }
    }
    if (!reason && !error) error = "missing terminal event";
  } catch (failure) {
    error = failure.message;
  }
  const automatic = checksFor(test, content),
    result = {
      id: test.id,
      group: test.group,
      prompt: test.prompt,
      profile: test.profile,
      checks: test.checks,
      automatic,
      firstContentMs,
      totalMs: Date.now() - start,
      reason,
      error,
      content,
      humanReview: "pending",
    };
  results = results.filter((r) => r.id !== test.id);
  results.push(result);
  console.log(
    JSON.stringify({
      id: test.id,
      totalMs: result.totalMs,
      reason,
      error,
      automatic,
    }),
  );
  await mkdir("docs/evaluations", { recursive: true });
  await writeFile(
    "docs/evaluations/advisor-live-results.json",
    JSON.stringify(
      {
        runAt: new Date().toISOString(),
        model: "nvidia/nemotron-3-ultra-550b-a55b",
        results,
      },
      null,
      2,
    ),
  );
}
if (
  results.some((r) => r.error || Object.values(r.automatic).some((ok) => !ok))
)
  process.exitCode = 1;
