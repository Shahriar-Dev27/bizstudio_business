import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const steps = [
  {
    id: "research",
    title: "Interview target customers",
    action: "Speak to five nearby snack buyers.",
    deliverable: "Five interview notes",
    check: "Record five answers about buying habits",
    timing: "Days 1–2",
    dependsOn: [],
  },
  {
    id: "pilot",
    title: "Run a preorder pilot",
    action: "Offer one small batch to interested buyers.",
    deliverable: "Paid orders and cost record",
    check: "Record actual orders and delivery costs",
    timing: "Days 3–5",
    dependsOn: ["research"],
  },
  {
    id: "review",
    title: "Review and decide",
    action: "Compare actual demand, cost and feedback.",
    deliverable: "A continue, change or stop decision",
    check: "Write the next experiment using real results",
    timing: "Day 7",
    dependsOn: ["pilot"],
  },
];
const roadmapText =
  "Start with demand validation. Timing is an estimate.\n\n```roadmap\n" +
  JSON.stringify({ title: "Dhaka snack pilot", steps }) +
  "\n```";
function wire(attemptId: string, text: string, reason = "stop") {
  const events = [
    { type: "start", requestId: "request-test", attemptId },
    { type: "progress", phase: "typing", requestId: "request-test", attemptId },
    { type: "delta", text, requestId: "request-test", attemptId },
    { type: "finish", reason, requestId: "request-test", attemptId },
  ];
  return events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join("");
}
async function ready(page: Page) {
  await page.goto("/advisor");
  await expect(
    page.getByRole("textbox", { name: "Ask BizGuide AI" }),
  ).toBeVisible();
}
async function send(page: Page, text: string) {
  await page.getByRole("textbox", { name: "Ask BizGuide AI" }).fill(text);
  await page.getByRole("button", { name: "Send message", exact: true }).click();
}
test("keeps navigation and notes visible with common advertising filters", async ({
  page,
}, info) => {
  await ready(page);
  // Cosmetic ad-blocking rules must not mistake advisor controls for adverts.
  await page.addStyleTag({
    content: ".adv-header, .adv-sidebar { display: none !important; }",
  });
  await expect(
    page.getByRole("link", { name: "Back to home", exact: true }),
  ).toBeInViewport();
  if (info.project.name === "mobile")
    await page.getByRole("button", { name: "Notes", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Pinned notes", exact: true }),
  ).toBeVisible();
});
test("shows thinking while waiting, then reveals the completed streamed result", async ({
  page,
}) => {
  let finish!: () => void;
  const waiting = new Promise<void>((resolve) => {
    finish = resolve;
  });
  await page.route("**/api/advisor/chat", async (route) => {
    await waiting;
    await route.fulfill({
      contentType: "text/event-stream",
      body: wire(
        route.request().postDataJSON().attemptId,
        "A precise completed recommendation.",
      ),
    });
  });
  await ready(page);
  await send(page, "Help me test demand");
  await expect(
    page.getByText("AI is thinking", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("A precise completed recommendation.", { exact: true }),
  ).toHaveCount(0);
  finish();
  await expect(
    page.getByText("A precise completed recommendation.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Stop response" })).toHaveCount(
    0,
  );
});
test("keeps interrupted stream text and retries the same user turn", async ({
  page,
}) => {
  let calls = 0;
  const payloads: unknown[] = [];
  await page.route("**/api/advisor/chat", async (route) => {
    calls++;
    const input = route.request().postDataJSON();
    payloads.push(input.messages);
    const attempt = input.attemptId;
    if (calls === 1)
      await route.fulfill({
        contentType: "text/event-stream",
        body: `data: ${JSON.stringify({
          type: "delta",
          requestId: "r",
          attemptId: attempt,
          text: "Useful partial business advice.",
        })}\n\n`,
      });
    else
      await route.fulfill({
        contentType: "text/event-stream",
        body: wire(attempt, "Recovered final advice."),
      });
  });
  await ready(page);
  await send(page, "Test my demand first");
  await expect(
    page.getByText("Useful partial business advice.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Retry this question" }).click();
  await expect(page.getByText("Recovered final advice.")).toBeVisible();
  await expect(
    page.getByRole("article", { name: "Your message", exact: true }),
  ).toHaveCount(1);
  expect(payloads).toHaveLength(2);
});
test("renders roadmap dependencies, pins chosen steps, saves completion and exports", async ({
  page,
}, info) => {
  await page.route("**/api/advisor/chat", (route) =>
    route.fulfill({
      contentType: "text/event-stream",
      body: wire(route.request().postDataJSON().attemptId, roadmapText),
    }),
  );
  await ready(page);
  await send(page, "Give a roadmap for my Dhaka snack business");
  await expect(
    page.getByRole("img", { name: /Dhaka snack pilot/ }),
  ).toBeVisible();
  const checks = page.getByRole("checkbox", {
    name: "Mark complete",
    exact: true,
  });
  await expect(checks).toHaveCount(3);
  await expect(checks.nth(1)).toBeDisabled();
  await checks.nth(0).check();
  await expect(checks.nth(1)).toBeEnabled();
  await page
    .getByRole("button", { name: "Pin this step", exact: true })
    .first()
    .click();
  if (info.project.name === "mobile")
    await page.getByRole("button", { name: "Notes", exact: true }).click();
  await expect(
    page
      .locator(".adv-note-text:visible")
      .filter({ hasText: "Interview target customers" }),
  ).toBeVisible();
  if (info.project.name === "mobile")
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Close", exact: true })
      .first()
      .click();
  await page
    .getByRole("button", { name: "Save on this device", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("checkbox", { name: "Mark complete", exact: true }).first(),
  ).toBeChecked();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export plan" }).click();
  expect((await download).suggestedFilename()).toMatch(/\.md$/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await mkdir(".agency/chat-improvements/evidence", { recursive: true });
  await page.screenshot({
    path: `.agency/chat-improvements/evidence/roadmap-${info.project.name}.png`,
  });
});
test("pins only selected answer text and retains an editable draft on reload", async ({
  page,
}, info) => {
  await page.route("**/api/advisor/chat", (route) =>
    route.fulfill({
      contentType: "text/event-stream",
      body: wire(
        route.request().postDataJSON().attemptId,
        "Interview five customers before renting a shop. Keep the pilot small.",
      ),
    }),
  );
  await ready(page);
  await send(page, "How should I validate demand?");
  await expect(
    page.getByText(
      "Interview five customers before renting a shop. Keep the pilot small.",
      { exact: true },
    ),
  ).toBeVisible();
  const answer = page.locator(".adv-message--assistant .adv-markdown p").last();
  await answer.evaluate((element) => {
    const range = document.createRange();
    range.setStart(element.firstChild!, 0);
    range.setEnd(element.firstChild!, 24);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  });
  await page
    .getByRole("button", { name: "Pin selected text", exact: true })
    .click();
  if (info.project.name === "mobile")
    await page.getByRole("button", { name: "Notes", exact: true }).click();
  await expect(
    page
      .locator(".adv-note-text:visible")
      .filter({ hasText: "Interview five customers" }),
  ).toBeVisible();
  await expect(
    page
      .locator(".adv-note-text:visible")
      .filter({ hasText: "Keep the pilot small" }),
  ).toHaveCount(0);
  if (info.project.name === "mobile")
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Close", exact: true })
      .first()
      .click();
  await page
    .getByRole("textbox", { name: "Ask BizGuide AI" })
    .fill("My next draft");
  await page.getByRole("link", { name: "Back to home" }).click();
  await page.goto("/advisor");
  await expect(
    page.getByRole("textbox", { name: "Ask BizGuide AI" }),
  ).toHaveValue("My next draft");
});
test("sends bounded context after forty turns and retains the confirmed brief", async ({
  page,
}) => {
  let payload:
    { messages: unknown[]; profile: { location: string } } | undefined;
  await page.addInitScript(() => {
    const messages = [
      {
        id: "welcome",
        role: "assistant",
        content: "Welcome",
        createdAt: 1,
        status: "complete",
        welcome: true,
      },
      ...Array.from({ length: 80 }, (_, i) => ({
        id: `m${i}`,
        turnId: `t${Math.floor(i / 2)}`,
        role: i % 2 ? "assistant" : "user",
        content: `Business turn ${i}`,
        createdAt: i + 2,
        status: "complete",
      })),
    ];
    sessionStorage.setItem(
      "bizguide-chat-session-v1",
      JSON.stringify({
        schemaVersion: 1,
        id: "forty-turns",
        title: "Long plan",
        messages,
        draft: "",
        updatedAt: 1,
        profile: { location: "Dhaka", budgetBdt: 50000 },
        completedSteps: {},
        locale: "en",
      }),
    );
  });
  await page.route("**/api/advisor/chat", (route) => {
    payload = route.request().postDataJSON();
    return route.fulfill({
      contentType: "text/event-stream",
      body: wire(
        route.request().postDataJSON().attemptId,
        "Still using your confirmed Dhaka context.",
      ),
    });
  });
  await ready(page);
  await send(page, "What should I do next?");
  await expect(
    page.getByText("Still using your confirmed Dhaka context."),
  ).toBeVisible();
  expect(payload!.messages.length).toBeLessThanOrEqual(24);
  expect(payload!.profile.location).toBe("Dhaka");
});
test("homepage carries a private draft without sending it to the provider", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/advisor/chat", (route) => {
    calls++;
    return route.fulfill({ status: 503, json: { error: "Unexpected call" } });
  });
  await page.goto("/");
  await page
    .getByLabel("Describe your business idea", { exact: true })
    .fill("A private bakery idea in Dhaka");
  await page
    .getByRole("button", { name: "Explore my idea", exact: false })
    .click();
  await expect(page).toHaveURL(/\/advisor$/);
  await expect(
    page.getByRole("textbox", { name: "Ask BizGuide AI" }),
  ).toHaveValue("A private bakery idea in Dhaka");
  expect(calls).toBe(0);
});
test("switches core controls to Bangla and recovers the preference", async ({
  page,
}) => {
  await ready(page);
  await page.getByLabel("Interface language").selectOption("bn");
  await expect(
    page.getByRole("textbox", { name: "BizGuide AI-কে জিজ্ঞাসা করুন" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(sessionStorage.getItem("bizguide-chat-session-v1") || "{}")
            .locale,
      ),
    )
    .toBe("bn");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "বার্তা পাঠান", exact: true }),
  ).toBeVisible();
});
