# BizGuide AI Advisor — Paper Arcade Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (agency pipeline) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking. One task per developer dispatch; each task ends with its own commit.

**Goal:** Restyle `/advisor` (header, transcript, messages, composer, states, notes panel/drawer) to the Paper Arcade look of the redesigned homepage. Chat behaviour, `/api/advisor/chat`, the system prompt, and localStorage notes stay functionally unchanged.

**Architecture:**
- Move the theme tokens and generic `mk-*` primitives verbatim out of `app/marketing.css` into `app/paper-arcade.css`. Import it once from the root layout so exactly one copy is always ordered before page CSS. The token/root block applies to `.marketing-page, .advisor-page`.
- The advisor gets its own `app/advisor/advisor.css`. Every selector starts with `.advisor-page` (or `:root:has(.advisor-page)`), and every class it defines is `adv-*`, so it can stay loaded after client navigation without touching the homepage.
- Fonts come from a shared `next/font` definitions file, applied on each page's root.
- The four advisor presentation files swap Tailwind utilities for `adv-*` and shared classes. Their behaviour-bearing lines stay byte-identical, and a script proves it.

**Tech Stack:** Next.js 16.2.10 (App Router, Turbopack), React 19.2, TypeScript 6, Tailwind 4.3.3 (kept for other pages; removed from advisor markup), lucide-react 1.24, `next/font/google`. Verification uses headless Chrome via `playwright-core` installed **outside the repo** (in the developer's scratchpad). No dependency changes.

**Spec:** `docs/superpowers/specs/2026-10-19-advisor-paper-arcade-design.md`

**Theme contract:** `docs/superpowers/specs/2026-10-19-homepage-theme.md`. Its "avoid marketing typography on the advisor" line is superseded by this request; see spec §Goal.

**Branch / base:** `feat/homepage-redesign`, on top of `fb9e636` (homepage plan complete, local only). Separate commits per task. **No push** (orchestrator ruling from the homepage pass: origin is the user's pre-existing repo).

## Global Constraints

1. **Palette and tokens.** Paper `#F4EBDD`, ink `#252820`, orange `#D94F30`, sage `#B9C7A5`, yellow `#F2CE67`, on-orange `#10120E`.
   - Use the `--mk-*` tokens only, never raw hex. The single exception is the two `:root:has(.advisor-page)` rules, where tokens are not in scope; they use `#f4ebdd` with a comment.
   - **No text is ever orange.** Any label on an orange surface uses `var(--mk-on-orange)`.
2. **Type.**
   - Space Grotesk for headings and body. IBM Plex Mono for labels and controls. Josefin Slab only as the editorial accent (empty-notes title).
   - Fallbacks stay `Arial, sans-serif` / `ui-monospace, monospace` / `Georgia, serif`.
   - Every heading element in the advisor carries a class that sets `font-family`, `line-height`, and `letter-spacing`. This defeats `globals.css`'s Manrope `h1–h4` rule.
3. **Geometry.**
   - Borders `2px solid ink`. Radius 4px (max 8).
   - Standard shadow `6px 6px 0 ink`; compact `4px 4px 0 ink`.
   - Controls at least 48px high. Icon controls at least 44x44.
   - Focus: 3px ink outline plus 3px paper separation, from the shared rule. Inputs never lose their outline.
4. **Scoping.**
   - `app/globals.css` is **not modified**.
   - Every selector in `app/advisor/advisor.css` starts with `.advisor-page` or `:root:has(.advisor-page)`. Keyframes are named `adv-*`.
   - Advisor markup uses only `adv-*` classes, the root `advisor-page`, and these shared classes: `mk-label`, `mk-chip`, `mk-panel`, `mk-panel--sage`, `mk-panel--yellow`, `mk-panel--compact`, `mk-button`, `mk-button-secondary`, `mk-icon-button`, `mk-sr-only`, `mk-slab`, `mk-slab-italic` (plus `mk-wordmark*` via `MarketingBrand`).
   - Advisor markup contains **no Tailwind utilities** and **no homepage-only `mk-*` classes**.
5. **Focus-ring safety.**
   - In `advisor.css`, no rule whose selector names a shared control class (`mk-button`, `mk-button-secondary`, `mk-icon-button`) or the `adv-*` classes put on such elements (`adv-header-button`, `adv-starter`, `adv-send`, `adv-stop`, `adv-alert-retry`, `adv-note-add`, `adv-notes-close`, `adv-note-btn`) may declare `box-shadow`, `outline`, `outline-offset`, `--mk-shadow`, or `transform`. The only exceptions are `:disabled` selectors.
   - Advisor-owned focusable controls (`adv-pin`, `adv-note-action`) never declare `box-shadow`, `outline`, or `outline-offset`.
   - Layout and typography overrides (padding, width, min-height, font, text-transform, white-space, justify-content) are allowed.
   - End every CSS declaration with a semicolon, because the checker relies on it.
6. **Behaviour.**
   - Do not change `app/api/**`, `lib/**`, `types/**`, `app/globals.css`, `components/marketing/**`, `components/site-header.tsx`, `components/hero-form.tsx`, `components/brand.tsx` (it becomes unused; leave it), `package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, or `postcss.config.mjs`.
   - In the advisor components, protected lines and substrings (see `check-advisor.cjs`) stay byte-identical. That covers state, effects, `addPin`/`updatePin`/`removePin`, `requestAdvice`, `submit`, `handleKeyDown`, `stop`, `resetChat`, `retry`, the storage key/format, the `?idea=` slice, the line parser, and the notes handlers.
   - New code is limited to:
     - render-only values derived from existing state (`liveStatus`, `showPrefill`);
     - `useId` for the notes input id;
     - the OQ1 items (`notesToggleRef`, `closeNotes`, drawer Escape handler, close-button `autoFocus`, reduced-motion autoscroll line), only if OQ1 is approved.
7. **Accessible names.** Every existing accessible name stays identical: "Send message", "Stop response", "Back to homepage", "New plan", "Notes…", "Pin this line", "This line is pinned", "Add note", "Copy note", "Edit note", "Remove note", "Save note", "Cancel editing", "Close notes", "Close notes overlay", "Quick note", "Ask BizGuide AI", "Pinned business notes", "BizGuide AI message", "Your message", "Retry".
   - Visible text must be contained in the name.
   - The one intended change: the Copy button is named "Copied" during its existing 1.4s state.
8. **No provider calls.** Every browser check intercepts `**/api/**` (fulfil with a mock or abort). Never send a real message.
9. **Preserve user state.**
   - `next-env.d.ts` (uncommitted user edit, EOL-only vs HEAD), `docs/superpowers/specs/2026-10-19-homepage-redesign-design.md` (modified), and the untracked docs must never be staged.
   - `next build`/`next dev` rewrite `next-env.d.ts`, so copy it to your scratchpad before any build and restore it afterwards.
   - A user `next dev` may be running on :3000. Leave it alone; use ports 3201 and up.
10. **Commits.** Stage exact file paths only (`git add <paths>`, never `-A` or a bare dot), and use the task's commit message. No push, merge, or branch change.

## Review Focus

1. **Behaviour unchanged.**
   - `check-advisor.cjs` prints `PASS`.
   - The behaviour harness JSON equals the pre-change baseline except the allow-listed expected diffs.
   - Verify in Tasks 2, 3, and 4.
2. **No homepage regression and no cross-route leakage.**
   - The homepage computed-style dump equals the baseline, both on direct load and after client navigation from `/advisor` (where `advisor.css` stays loaded).
   - The advisor dump is equal on direct load and after client navigation from the homepage.
   - Verify in Tasks 1 and 4.
3. **Focus ring never clobbered.** Every focusable advisor control shows a 3px solid ink outline when focused by keyboard. Verify in Tasks 2, 3, and 4.
4. **Small screens.** At 320x568 and 390x844, with and without web fonts: the header fits with no overlap, there is no horizontal overflow, the body does not scroll, and the composer is always visible. Verify in Tasks 2 and 4.
5. **Notes drawer.**
   - Dialog semantics are present.
   - With OQ1: Escape closes the drawer, focus goes into it on open, and focus returns to the Notes button on close.
   - Unique quick-note ids when sidebar and drawer coexist.
   - Verify in Tasks 2, 3, and 4.

---

## File ownership

| File | Task | Change |
| --- | --- | --- |
| `app/paper-arcade.css` | 1 | Create: moved tokens/primitives (verbatim + 4 selector-list edits + comments) |
| `app/paper-arcade-fonts.ts` | 1 | Create: font definitions file |
| `app/marketing.css` | 1 | Remove moved blocks; rewrite header comment. Nothing else. |
| `app/layout.tsx` | 1 | Add `import "./paper-arcade.css";` after the globals import |
| `app/page.tsx` | 1 | Replace inline font calls with the shared import |
| `app/advisor/page.tsx` | 2 | Root wrapper, CSS import, fonts, fallback markup |
| `app/advisor/advisor.css` | 2 creates the Shell section; 3 appends below the Task 3 marker only | New scoped stylesheet |
| `components/advisor-experience.tsx` | 2 | Markup/classes; render-only derived values; OQ1 items |
| `components/advisor-message.tsx` | 3 | Markup/classes only |
| `components/pinned-notes.tsx` | 3 | Markup/classes; `useId`; OQ1 `autoFocus` |
| `.agency/advisor-paper-arcade/evidence/**` | 1–4 | Verification output (git-ignored via `.git/info/exclude`) |

**Sequencing:** 1 then 2, then 3, then 4, and optionally 5. Nothing runs in parallel:
- Task 1 changes the cascade that Tasks 2 and 3 build on.
- Tasks 2 and 3 share `advisor.css`, and Task 2's shell is the visual context for Task 3.

## Execution setup (orchestrator, before Task 1)

- [ ] Get the open questions answered (bottom of this plan). If there are no answers, use the recommended defaults.
- [ ] Create `.agency/advisor-paper-arcade/ledger.md` and an `evidence/` folder beside it.
- [ ] Record BASE (the output of `git rev-parse HEAD`, expected `fb9e6366be2301dea212d667f532e398521ffe16`) and whether OQ1 is approved. Every task passes `--oq1` to the checkers only when it is.
- [ ] Confirm `git status --short` shows only the user's pre-existing items:
  - modified `docs/superpowers/specs/2026-10-19-homepage-redesign-design.md`
  - modified `next-env.d.ts`
  - untracked `docs/superpowers/plans/` and the two untracked specs

  If any source file is dirty, stop and ask.
- [ ] Hand each developer exactly one task section, plus the "Verification tooling" section and the Global Constraints.

## Verification tooling (every task uses this; copy the scripts verbatim)

Setup, once per developer session. `SCRATCH` is your own scratchpad directory.

1. Run `npm install --prefix "SCRATCH/pw" playwright-core` (outside the repo, so `package.json` is untouched) and set `PW_DIR=SCRATCH/pw`.
   - The scripts launch system Chrome (`PW_CHANNEL` defaults to `chrome`).
   - If Chrome is unavailable, run `npx --prefix "SCRATCH/pw" playwright-core install chromium` and set `PW_CHANNEL=bundled`.
2. Save Scripts A–E below into `SCRATCH/advisor-tools/`.
   - **Never save them inside the repo.** `eslint .` lints `.cjs` files anywhere in the tree, including `.agency/`.
   - The plan text is the canonical copy, so baseline and later runs use identical code.
3. Production server for evidence:
   - Copy `next-env.d.ts` to `SCRATCH`.
   - Run `npm run build`, then `npx next start -p <port>` on ports 3201 and up.
   - Stop the server when done, then restore `next-env.d.ts` from the copy.
   - A dev server is fine for iteration, but evidence always comes from `next start`: Next documents that CSS order can differ in dev.
4. Evidence files go in `.agency/advisor-paper-arcade/evidence/` (JSON/PNG only) under the names each task gives.

### Script A — `check-advisor.cjs` (static proof that advisor edits are presentational)

Run from the repo root: `node SCRATCH/advisor-tools/check-advisor.cjs <BASE> [--oq1]`. Expected final line: `PASS`.

```js
"use strict";
const { execSync } = require("node:child_process");
const fs = require("node:fs");

const [base, flag] = process.argv.slice(2);
if (!base) { console.error("usage: check-advisor.cjs <BASE_SHA> [--oq1]"); process.exit(2); }
const oq1 = flag === "--oq1";
let failures = 0;
const fail = (message) => { failures += 1; console.log("FAIL " + message); };
const atBase = (file) => execSync(`git show ${base}:${file}`, { encoding: "utf8" });
const now = (file) => fs.readFileSync(file, "utf8");
const count = (text, needle) => text.split(needle).length - 1;

// 1. Protected base lines (1-based) must still exist verbatim (trimmed), in the same order.
const protectedLines = {
  "components/advisor-experience.tsx": { ranges: [[8, 9], [14, 153]], skip: oq1 ? [62] : [] },
  "components/advisor-message.tsx": { ranges: [[5, 5], [7, 7], [9, 9], [13, 19], [27, 34]], skip: [] },
  "components/pinned-notes.tsx": { ranges: [[5, 5], [7, 15]], skip: [] },
};
for (const [file, rule] of Object.entries(protectedLines)) {
  const before = atBase(file).split(/\r?\n/);
  const after = now(file).split(/\r?\n/).map((line) => line.trim());
  let cursor = 0;
  for (const [from, to] of rule.ranges) {
    for (let n = from; n <= to; n += 1) {
      if (rule.skip.includes(n)) continue;
      const want = before[n - 1].trim();
      if (!want) continue;
      const at = after.indexOf(want, cursor);
      if (at === -1) fail(`${file}:${n} protected line missing or reordered: ${want.slice(0, 140)}`);
      else cursor = at + 1;
    }
  }
}

// 2. Protected substrings: occurrence count must equal the base count plus the documented delta.
const S = (needle, delta = 0) => ({ needle, delta });
const protectedSubstrings = {
  "components/advisor-experience.tsx": [
    S("onClick={resetChat}"), S("onClick={() => setNotesOpen(true)}"), S("onClick={() => void requestAdvice(starter)}"),
    S("{starters.map((starter) => "), S("<AdvisorMessageCard key={message.id} message={message} onPin={addPin} pinnedTexts={pinnedTexts} />"),
    S("{messages.length === 1 && "), S("<div ref={scrollAnchorRef} />"), S("{error && "), S("{lastUserText && !sending && "),
    S("onClick={retry}"), S("onSubmit={submit}"), S("ref={composerRef}"), S("id=\"advisor-composer\""), S("htmlFor=\"advisor-composer\""),
    S("Ask BizGuide AI"), S("value={draft}"), S("onChange={(event) => { setDraft(event.target.value); setError(\"\"); }}"),
    S("onKeyDown={handleKeyDown}"), S("rows={2}"), S("maxLength={4000}"), S("disabled={sending}"), S("onClick={stop}"),
    S("type=\"submit\" disabled={!draft.trim()}"), S("\"Describe your idea, location, budget, or ask your next business question…\""),
    S("<PinnedNotes notes={pins} onAdd={(text) => addPin(text)} onUpdate={updatePin} onRemove={removePin}"),
    S("{notesOpen && "), S("{pinNotice && "), S("{pinNotice}"), S("{pins.length > 0 && "), S("{pins.length}"),
    S("href=\"/\""), S("role=\"alert\""), S("aria-label=\"Back to homepage\""), S("aria-label=\"Stop response\""),
    S("aria-label=\"Send message\""), S("aria-label=\"Close notes overlay\""), S("New plan"),
    S("BizGuide can make mistakes. Verify legal, financial, pricing, and local market details with current official sources."),
    S("onClick={() => setNotesOpen(false)}", oq1 ? -1 : 0), S("onClose={() => setNotesOpen(false)}", oq1 ? -1 : 0),
    S("scrollAnchorRef.current?.scrollIntoView({ behavior: sending && !window.matchMedia(\"(prefers-reduced-motion: reduce)\").matches ? \"smooth\" : \"auto\", block: \"end\" });", oq1 ? 1 : 0),
  ],
  "components/advisor-message.tsx": [
    S("onClick={() => onPin(clean, message.id)}"), S("{assistant && clean.length > 8 && "), S("{message.streaming && !message.content ? "),
    S("key={`${index}-${clean.slice(0, 18)}`}"), S("aria-label={pinned ? \"This line is pinned\" : \"Pin this line\"}"),
    S("title={pinned ? \"Pinned\" : \"Pin this insight\"}"), S("<InlineText text={clean} />"), S("<InlineText text={trimmed} />"),
    S("{part.slice(2, -2)}"), S("part.startsWith(\"**\") && part.endsWith(\"**\") ? "),
    S("aria-label={assistant ? \"BizGuide AI message\" : \"Your message\"}"), S("{heading ? "), S(": bullet || numbered ? "),
  ],
  "components/pinned-notes.tsx": [
    S("onSubmit={addNote}"), S("value={draft}"), S("maxLength={300}"), S("onChange={(event) => setDraft(event.target.value)}"),
    S("disabled={!draft.trim()}"), S("aria-label=\"Add note\""), S("{notes.length === 0 ? "), S("{notes.map((note) => "),
    S("{editingId === note.id ? "), S("value={editingText}"), S("onChange={(event) => setEditingText(event.target.value)}"),
    S("rows={4}"), S("maxLength={500}"), S("onClick={() => setEditingId(null)}"), S("onClick={() => save(note)}"),
    S("onDoubleClick={() => { setEditingId(note.id); setEditingText(note.text); }}"),
    S("onClick={() => { setEditingId(note.id); setEditingText(note.text); }}"), S("onClick={() => copy(note)}"),
    S("onClick={() => onRemove(note.id)}"), S("{onClose && "), S("onClick={onClose}"),
    S("{notes.length} saved insight{notes.length === 1 ? \"\" : \"s\"}"), S("{note.sourceMessageId ? \"From advisor\" : \"Personal note\"}"),
    S("{copiedId === note.id ? "), S("{note.text}"), S("aria-label=\"Cancel editing\""), S("aria-label=\"Save note\""),
    S("aria-label=\"Edit note\""), S("aria-label=\"Remove note\""), S("aria-label=\"Close notes\""), S("Copy note"),
    S("aria-label=\"Pinned business notes\""), S("Quick note"), S("Important ideas live here"),
    S("Pin any advisor paragraph or add your own reminder."), S("autoFocus", oq1 ? 1 : 0),
  ],
};
for (const [file, list] of Object.entries(protectedSubstrings)) {
  const before = atBase(file);
  const after = now(file);
  for (const { needle, delta } of list) {
    const expected = count(before, needle) + delta;
    const actual = count(after, needle);
    if (actual !== expected) fail(`${file}: "${needle.slice(0, 90)}" expected ${expected}, found ${actual}`);
  }
}

// 3. Files that must not differ from base (committed or working tree).
const forbidden = ["app/api", "lib", "types", "app/globals.css", "components/marketing", "components/site-header.tsx",
  "components/hero-form.tsx", "components/brand.tsx", "package.json", "package-lock.json", "next.config.ts",
  "tsconfig.json", "eslint.config.mjs", "postcss.config.mjs"];
const touched = execSync(`git diff --name-only ${base} -- ${forbidden.join(" ")}`, { encoding: "utf8" }).trim();
if (touched) fail("forbidden files changed since base:\n" + touched);

// 4. Advisor markup may only use adv-*, advisor-page, and the allowed shared mk-* classes (no Tailwind).
const allowed = /^(advisor-page|adv-[a-z0-9-]+|mk-(label|chip|panel|panel--sage|panel--yellow|panel--compact|button|button-secondary|icon-button|sr-only|slab|slab-italic))$/;
for (const file of ["app/advisor/page.tsx", "components/advisor-experience.tsx", "components/advisor-message.tsx", "components/pinned-notes.tsx"]) {
  for (const match of now(file).matchAll(/className=("[^"]*"|\{[^\n]*?\}(?=[\s/>]))/g)) {
    const literals = [...match[1].matchAll(/"([^"]*)"|`([^`]*)`/g)].map((m) => (m[1] ?? m[2]).replace(/\$\{[^}]*\}/g, " "));
    for (const token of literals.join(" ").split(/\s+/).filter(Boolean)) {
      if (!allowed.test(token)) fail(`${file}: class token "${token}" is not adv-*, advisor-page, or an allowed mk-* class`);
    }
  }
}

// 5. advisor.css: every selector scoped; adv-* keyframes; focus-ring-safe declarations.
const cssPath = "app/advisor/advisor.css";
if (fs.existsSync(cssPath)) {
  const css = now(cssPath).replace(/\/\*[\s\S]*?\*\//g, "");
  const sharedControl = /\b(mk-button|mk-button-secondary|mk-icon-button|adv-header-button|adv-starter|adv-send|adv-stop|adv-alert-retry|adv-note-add|adv-notes-close|adv-note-btn)\b/;
  const ownControl = /\b(adv-pin|adv-note-action)\b/;
  let depth = 0;
  let keyframesAt = -1;
  let buffer = "";
  let rule = null;
  const checkDeclaration = (text) => {
    if (!rule || !text.includes(":")) return;
    const prop = text.slice(0, text.indexOf(":")).trim();
    if (sharedControl.test(rule) && !rule.includes(":disabled") && ["box-shadow", "outline", "outline-offset", "--mk-shadow", "transform"].includes(prop)) fail(`advisor.css: ${prop} in shared-control rule "${rule}"`);
    if (ownControl.test(rule) && ["box-shadow", "outline", "outline-offset"].includes(prop)) fail(`advisor.css: ${prop} in own-control rule "${rule}"`);
  };
  for (const ch of css) {
    if (ch === "{") {
      const prelude = buffer.trim();
      buffer = "";
      if (prelude.startsWith("@keyframes")) {
        if (!/^@keyframes\s+adv-/.test(prelude)) fail(`advisor.css: keyframes must be named adv-*: ${prelude}`);
        keyframesAt = depth;
        rule = null;
      } else if (prelude.startsWith("@")) {
        rule = null;
      } else if (keyframesAt < 0) {
        for (const sel of prelude.split(",").map((s) => s.trim())) {
          if (!/^(\.advisor-page|:root:has\(\.advisor-page\))(?![\w-])/.test(sel)) fail(`advisor.css: unscoped selector "${sel}"`);
        }
        rule = prelude;
      }
      depth += 1;
    } else if (ch === "}") {
      checkDeclaration(buffer);
      buffer = "";
      rule = null;
      depth -= 1;
      if (depth === keyframesAt) keyframesAt = -1;
    } else if (ch === ";") {
      checkDeclaration(buffer);
      buffer = "";
    } else {
      buffer += ch;
    }
  }
}

console.log(failures ? `FAIL (${failures})` : "PASS");
process.exit(failures ? 1 : 0);
```

### Script B — `advisor-behaviour.cjs` (markup-agnostic behaviour harness)

Run: `PW_DIR=... node SCRATCH/advisor-tools/advisor-behaviour.cjs http://localhost:<port> <out.json>`.

- It selects elements only by id, role, accessible name, label, and text, so it runs unchanged against the old and the new markup.
- Every `/api/**` request is intercepted, so nothing reaches the server or the AI provider. Request bodies are recorded so payload equality is proven.
- Its JSON output is compared with Script C.

```js
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(path.join(process.env.PW_DIR, "node_modules", "playwright-core"));

const [baseUrl, outFile] = process.argv.slice(2);
const KEY = "bizguide-pinned-notes-v1";
const REPLY = [
  "## Quick view",
  "- **Test demand** with 20 preorders before renting a shop.",
  "1. Visit three bakeries in Mirpur this week and count customers.",
  "ঢাকায় বেকারি শুরু করতে ৳২ লাখ বাজেটের একটি পরীক্ষামূলক পরিকল্পনা করুন।",
  "",
  "A plain paragraph about the budget range in BDT and what to verify locally.",
].join("\n");
const sse = (text) => (text.match(/[\s\S]{1,24}/g) || [])
  .map((chunk) => `data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n\n`).join("") + "data: [DONE]\n\n";
const norm = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

(async () => {
  const channel = process.env.PW_CHANNEL === "bundled" ? undefined : (process.env.PW_CHANNEL || "chrome");
  const browser = await chromium.launch({ channel });
  const out = { requests: [], flows: {} };
  let mode = "ok";
  const intercept = (context) => context.route("**/api/**", async (route) => {
    const request = route.request();
    let body = null;
    try { body = request.postDataJSON(); } catch { body = request.postData(); }
    out.requests.push({ mode, path: new URL(request.url()).pathname, method: request.method(), body });
    const ok = { status: 200, headers: { "content-type": "text/event-stream; charset=utf-8" }, body: sse(REPLY) };
    if (mode === "ok") return route.fulfill(ok);
    if (mode === "503") return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "OpenRouter is not configured on the server." }) });
    if (mode === "400") return route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ error: "Send between 1 and 30 valid conversation messages." }) });
    if (mode === "slow") { await new Promise((resolve) => setTimeout(resolve, 4000)); return route.fulfill(ok).catch(() => {}); }
    return route.abort("failed");
  });
  const notes = (page) => page.evaluate((key) => (JSON.parse(localStorage.getItem(key) || "null") || [])
    .map((note) => ({ text: note.text, fromAdvisor: Boolean(note.sourceMessageId) })), KEY);
  const transcript = (page) => page.locator("article[aria-label=\"BizGuide AI message\"], article[aria-label=\"Your message\"]")
    .evaluateAll((els) => els.map((el) => ({
      who: el.getAttribute("aria-label"),
      lines: [...el.querySelectorAll("h3, p")].map((n) => n.textContent.replace(/\s+/g, " ").trim()).filter(Boolean),
    })));
  const alertInfo = async (page) => {
    const alert = page.getByRole("alert");
    if (!(await alert.count())) return null;
    return { text: norm((await alert.first().textContent()).replace(/Retry\s*$/, "")), retry: await alert.getByRole("button", { name: "Retry" }).count() };
  };
  const settled = (page) => page.waitForFunction(() => {
    const box = document.querySelector("#advisor-composer");
    return box && !box.disabled && document.body.textContent.includes("what to verify locally");
  });

  // Desktop flows (1440x900): prefill, validation, streaming reply, pins, notes CRUD, reload, errors, stop, new plan, starter.
  const desk = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ["clipboard-read", "clipboard-write"] });
  await intercept(desk);
  const page = await desk.newPage();
  const idea = "ঢাকায় bakery & coffee?\nSecond line ৳2 lakh";
  await page.goto(`${baseUrl}/advisor?idea=${encodeURIComponent(idea)}`);
  const composer = page.locator("#advisor-composer");
  await composer.waitFor();
  await page.waitForTimeout(500);
  const send = page.getByRole("button", { name: "Send message" });
  out.flows.prefill = { value: await composer.inputValue(), requests: out.requests.length, transcript: await transcript(page),
    starter: await page.getByRole("button", { name: "Create a low-risk 30-day launch plan." }).count() };

  await composer.fill("a");
  await composer.press("Enter");
  out.flows.validation = { alert: await alertInfo(page), requests: out.requests.length };
  await composer.fill("Bakery in Dhaka with 2 lakh");
  out.flows.validationClearedOnType = await alertInfo(page);

  await send.click();
  await settled(page);
  out.flows.reply = { transcript: await transcript(page), body: out.requests.at(-1).body,
    pinButtons: await page.getByRole("button", { name: "Pin this line" }).count(),
    focus: await page.evaluate(() => document.activeElement && document.activeElement.id) };

  await page.getByRole("button", { name: "Pin this line" }).last().click();
  await page.getByText("Pinned to notes").waitFor();
  out.flows.pin = { pinned: await page.getByRole("button", { name: "This line is pinned" }).count(), storage: await notes(page) };
  await page.getByRole("button", { name: "This line is pinned" }).first().click();
  await page.getByText("Already pinned").waitFor();
  out.flows.pinAgain = { storage: await notes(page) };

  const panel = page.getByRole("complementary", { name: "Pinned business notes" });
  await panel.getByLabel("Quick note").fill("Visit 3 bakeries in Mirpur");
  await panel.getByRole("button", { name: "Add note" }).click();
  await panel.getByRole("button", { name: "Edit note" }).first().click();
  await panel.locator("textarea").fill("Visit 4 bakeries in Mirpur");
  await panel.getByRole("button", { name: "Save note" }).click();
  await panel.getByRole("button", { name: "Copy note" }).first().click();
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  await panel.getByRole("button", { name: "Edit note" }).first().click();
  await panel.locator("textarea").fill("SHOULD NOT SAVE");
  await panel.getByRole("button", { name: "Cancel editing" }).click();
  await panel.getByText("Visit 4 bakeries in Mirpur").dblclick();
  const doubleClickOpensEditor = await panel.locator("textarea").count();
  await panel.getByRole("button", { name: "Cancel editing" }).click();
  const beforeRemove = await notes(page);
  await panel.getByRole("button", { name: "Remove note" }).last().click();
  out.flows.notes = { beforeRemove, after: await notes(page), clip, doubleClickOpensEditor,
    countText: (norm(await panel.textContent()).match(/\d+ saved insights?/) || [null])[0] };

  await page.reload();
  await composer.waitFor();
  await page.waitForTimeout(600);
  out.flows.reload = { transcript: await transcript(page), storage: await notes(page), draft: await composer.inputValue(),
    countText: (norm(await panel.textContent()).match(/\d+ saved insights?/) || [null])[0] };

  mode = "503";
  await composer.fill("Second question about rent in Mirpur");
  await send.click();
  await page.getByRole("alert").waitFor();
  out.flows.error503 = { alert: await alertInfo(page), transcript: await transcript(page) };

  mode = "abort";
  await page.getByRole("button", { name: "Retry" }).click();
  await page.waitForFunction(() => !document.querySelector("#advisor-composer").disabled);
  await page.waitForTimeout(400);
  out.flows.retryAborted = { alert: await alertInfo(page), body: out.requests.at(-1).body, transcript: await transcript(page) };

  mode = "400";
  await composer.fill("Third question");
  await send.click();
  await page.waitForTimeout(800);
  out.flows.error400 = { alert: await alertInfo(page) };

  mode = "slow";
  await composer.fill("Slow question");
  await send.click();
  const stop = page.getByRole("button", { name: "Stop response" });
  await stop.waitFor();
  out.flows.pending = { composerDisabled: await composer.isDisabled(), sendButtons: await send.count(),
    assistantArticles: await page.locator("article[aria-label=\"BizGuide AI message\"]").count() };
  await stop.click();
  await page.getByRole("alert").waitFor();
  await page.waitForTimeout(400);
  out.flows.stopped = { alert: await alertInfo(page), transcript: await transcript(page),
    focus: await page.evaluate(() => document.activeElement && document.activeElement.id) };

  mode = "ok";
  await page.getByRole("button", { name: "New plan" }).click();
  out.flows.newPlan = { transcript: await transcript(page), draft: await composer.inputValue(), alert: await alertInfo(page), storage: await notes(page) };
  await page.getByRole("button", { name: "Create a low-risk 30-day launch plan." }).click();
  await settled(page);
  out.flows.starter = { body: out.requests.at(-1).body, transcript: await transcript(page) };
  await desk.close();

  // Mobile flows (390x844): New plan reachable, drawer add/close, Escape, scrim, focus after close.
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await intercept(mobile);
  mode = "abort";
  const mp = await mobile.newPage();
  await mp.goto(`${baseUrl}/advisor`);
  await mp.locator("#advisor-composer").waitFor();
  await mp.waitForTimeout(600);
  const focusName = () => mp.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return "BODY";
    return el.getAttribute("aria-label") || el.textContent.replace(/\s+/g, " ").trim();
  });
  const drawer = mp.getByRole("complementary", { name: "Pinned business notes" });
  const toggle = mp.getByRole("button", { name: /^Notes/ });
  const newPlanVisible = await mp.getByRole("button", { name: "New plan" }).isVisible().catch(() => false);
  await toggle.click();
  await drawer.getByLabel("Quick note").fill("Mobile note");
  await drawer.getByRole("button", { name: "Add note" }).click();
  const storage = await notes(mp);
  await drawer.getByRole("button", { name: "Close notes", exact: true }).click();
  const closedByButton = !(await drawer.isVisible().catch(() => false));
  const focusAfterClose = await focusName();
  await toggle.click();
  await mp.keyboard.press("Escape");
  await mp.waitForTimeout(300);
  const escapeCloses = !(await drawer.isVisible().catch(() => false));
  if (!escapeCloses) await drawer.getByRole("button", { name: "Close notes", exact: true }).click();
  await toggle.click();
  await mp.getByRole("button", { name: "Close notes overlay" }).click({ position: { x: 8, y: 300 }, force: true });
  const scrimCloses = !(await drawer.isVisible().catch(() => false));
  out.flows.mobile = { newPlanVisible, storage, closedByButton, focusAfterClose, escapeCloses, scrimCloses, requests: out.requests.length };
  await mobile.close();

  await browser.close();
  fs.writeFileSync(outFile, JSON.stringify(out, null, 2));
  console.log(`wrote ${outFile}: ${out.requests.length} intercepted /api requests, 0 reached the network`);
})().catch((error) => { console.error(error); process.exit(1); });
```

**Expected diffs** between the baseline and the restyle. Script C's allow-list:
- `flows.mobile.newPlanVisible`: `false` becomes `true`. New plan is no longer hidden on mobile.
- With `--oq1`, also:
  - `flows.mobile.escapeCloses`: `false` becomes `true`.
  - `flows.mobile.focusAfterClose`: `"BODY"` becomes the Notes button name.

Any other difference is a behaviour regression.

### Script C — `compare-json.cjs` (deep diff with an allow-list)

Run: `node SCRATCH/advisor-tools/compare-json.cjs <baseline.json> <current.json> [--allow=path1,path2]`. Expected final line: `PASS`.

```js
"use strict";
const fs = require("node:fs");
const [a, b, ...rest] = process.argv.slice(2);
const allow = new Set((rest.find((x) => x.startsWith("--allow=")) || "--allow=").slice(8).split(",").filter(Boolean));
const base = JSON.parse(fs.readFileSync(a, "utf8"));
const current = JSON.parse(fs.readFileSync(b, "utf8"));
const diffs = [];
(function walk(x, y, at) {
  if (JSON.stringify(x) === JSON.stringify(y)) return;
  if (x && y && typeof x === "object" && typeof y === "object") {
    for (const key of new Set([...Object.keys(x), ...Object.keys(y)])) walk(x[key], y[key], at ? `${at}.${key}` : key);
    return;
  }
  diffs.push({ at, x, y, expected: [...allow].some((p) => at === p || at.startsWith(p + ".")) });
})(base, current, "");
for (const d of diffs) console.log(`${d.expected ? "EXPECTED  " : "UNEXPECTED"} ${d.at}: ${JSON.stringify(d.x)} -> ${JSON.stringify(d.y)}`.slice(0, 400));
const unexpected = diffs.filter((d) => !d.expected).length;
console.log(unexpected ? `FAIL (${unexpected} unexpected)` : "PASS");
process.exit(unexpected ? 1 : 0);
```

Allow-list values:
- **Behaviour:** without OQ1, `--allow=flows.mobile.newPlanVisible`. With OQ1, `--allow=flows.mobile.newPlanVisible,flows.mobile.escapeCloses,flows.mobile.focusAfterClose`.
- **Style dumps:** no allow-list, except that the advisor direct-vs-via-nav comparison in Task 4 allows `1440.focus,390.focus` (where focus starts after client navigation can differ). An allowed path also covers everything under it.

### Script D — `style-dump.cjs` (computed-style snapshot for regression and leak checks)

Run: `node SCRATCH/advisor-tools/style-dump.cjs http://localhost:<port> <out.json> <home|advisor> [--via-nav]`.

- `--via-nav` on `home` starts at `/advisor` and clicks a link to the homepage, so the advisor CSS is already loaded.
- `--via-nav` on `advisor` starts at the homepage and clicks the first `/advisor` link.
- Reduced motion keeps the homepage static and deterministic. Classes containing `__` (next/font hashed variable classes) are dropped from element keys. Hashed font-family names are normalised.

```js
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(path.join(process.env.PW_DIR, "node_modules", "playwright-core"));
const [baseUrl, outFile, route, flag] = process.argv.slice(2);
const viaNav = flag === "--via-nav";
const PROPS = ["display", "position", "width", "height", "margin", "padding", "color", "background-color", "background-image",
  "border-top", "border-right", "border-bottom", "border-left", "border-radius", "box-shadow", "outline", "font-family",
  "font-size", "font-weight", "line-height", "letter-spacing", "text-transform", "opacity", "transform", "color-scheme",
  "grid-template-columns", "gap", "white-space"];

(async () => {
  const channel = process.env.PW_CHANNEL === "bundled" ? undefined : (process.env.PW_CHANNEL || "chrome");
  const browser = await chromium.launch({ channel });
  const result = {};
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    await context.route("**/api/**", (r) => r.abort());
    const page = await context.newPage();
    if (route === "home") {
      if (viaNav) { await page.goto(`${baseUrl}/advisor`); await page.locator("#advisor-composer").waitFor(); await page.locator("a[href=\"/\"]:visible").last().click(); }
      else await page.goto(`${baseUrl}/`);
      await page.locator(".marketing-page").waitFor();
    } else {
      if (viaNav) { await page.goto(`${baseUrl}/`); await page.locator(".marketing-page").waitFor(); await page.locator("a[href=\"/advisor\"]:visible").first().click(); }
      else await page.goto(`${baseUrl}/advisor`);
      await page.locator("#advisor-composer").waitFor();
    }
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(800);
    const rootSelector = route === "home" ? ".marketing-page" : "body";
    const elements = await page.evaluate(([selector, props]) => {
      const fix = (value) => value.replace(/__([A-Za-z0-9_]+?)_[0-9a-f]{6}\b/g, "$1");
      const root = document.querySelector(selector);
      return [root, ...root.querySelectorAll("*")].map((el) => {
        const cs = getComputedStyle(el);
        const key = el.tagName.toLowerCase() + "." + (el.getAttribute("class") || "").split(/\s+/).filter((c) => c && !c.includes("__")).join(".");
        return [key, ...props.map((p) => fix(cs.getPropertyValue(p)))].join(" | ");
      });
    }, [rootSelector, PROPS]);
    const focus = [];
    for (let i = 0; i < 12; i += 1) {
      await page.keyboard.press("Tab");
      focus.push(await page.evaluate(() => { const el = document.activeElement; const cs = getComputedStyle(el);
        return `${el.tagName.toLowerCase()}|${el.getAttribute("aria-label") || el.textContent.trim().slice(0, 40)}|${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}|${cs.boxShadow}`; }));
    }
    const htmlScheme = await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme);
    result[viewport.width] = { htmlScheme, elements, focus };
    await context.close();
  }
  await browser.close();
  fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
  console.log(`wrote ${outFile}`);
})().catch((error) => { console.error(error); process.exit(1); });
```

### Script E — `advisor-metrics.cjs` (responsive, contrast, focus, motion, and drawer checks plus screenshots)

Run: `node SCRATCH/advisor-tools/advisor-metrics.cjs http://localhost:<port> <outDir> [--oq1]`.

- Prints each violation and exits 1 if there are any.
- Writes `metrics.json` and PNGs to `<outDir>`.
- Before Task 3 lands, message and notes styling is still old, so Task 2 treats violations inside `.adv-message`/`.adv-notes` as informational.

```js
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(path.join(process.env.PW_DIR, "node_modules", "playwright-core"));
const [baseUrl, outDir, flag] = process.argv.slice(2);
const oq1 = flag === "--oq1";
fs.mkdirSync(outDir, { recursive: true });
const REPLY = "## Quick view\n- **Test demand** with 20 preorders before renting a shop.\n1. Visit three bakeries in Mirpur.\nঢাকায় বেকারি শুরু করতে ৳২ লাখ।\n\nA plain paragraph about what to verify locally.";
const sse = (t) => (t.match(/[\s\S]{1,24}/g) || []).map((c) => `data: ${JSON.stringify({ choices: [{ delta: { content: c } }] })}\n\n`).join("") + "data: [DONE]\n\n";
const LONG = "Unbroken: " + "x".repeat(300) + " and a normal ending sentence.";

function measure() {
  const vw = innerWidth, vh = innerHeight, v = [];
  const shown = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none"; };
  const box = (sel) => { const el = document.querySelector(sel); return el && shown(el) ? el.getBoundingClientRect() : null; };
  if (document.documentElement.scrollWidth > vw) v.push(`document overflows horizontally (${document.documentElement.scrollWidth} > ${vw})`);
  if (document.scrollingElement.scrollHeight > vh + 1) v.push(`body scrolls (${document.scrollingElement.scrollHeight} > ${vh})`);
  for (const el of document.querySelectorAll(".adv-transcript, .adv-notes-list-wrap")) if (shown(el) && el.scrollWidth > el.clientWidth + 1) v.push(`${el.className} overflows horizontally`);
  for (const el of document.querySelectorAll(".advisor-page button, .advisor-page a, .advisor-page textarea, .advisor-page input")) {
    if (!shown(el) || el.classList.contains("adv-drawer-scrim")) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 43.5 || r.height < 43.5) v.push(`small target "${el.getAttribute("aria-label") || el.textContent.trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
    if (r.right > vw + 0.5 || r.left < -0.5) v.push(`control off-screen "${el.getAttribute("aria-label") || el.className}"`);
  }
  const items = [document.querySelector(".adv-header-brand"), ...document.querySelectorAll(".adv-header-actions > *")].filter((el) => el && shown(el));
  for (let i = 0; i < items.length; i += 1) for (let j = i + 1; j < items.length; j += 1) {
    const a = items[i].getBoundingClientRect(), b = items[j].getBoundingClientRect();
    if (a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom && b.top < a.bottom) v.push(`header overlap: ${items[i].className} / ${items[j].className}`);
  }
  const brand = document.querySelector(".adv-header-brand");
  if (brand && brand.scrollWidth > brand.clientWidth + 1) v.push("wordmark clipped inside header brand");
  const header = box(".adv-header"), composer = box(".adv-composer"), transcript = document.querySelector(".adv-transcript");
  if (!composer || !header || composer.bottom > vh + 0.5 || composer.top < header.bottom) v.push("composer not fully visible below header");
  const transcriptHeight = transcript ? transcript.clientHeight : 0;
  if (transcriptHeight < 160) v.push(`transcript too short (${transcriptHeight}px)`);
  for (const el of document.querySelectorAll(".advisor-page *")) {
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (hasText && shown(el) && getComputedStyle(el).color === "rgb(217, 79, 48)") v.push(`orange text: "${el.textContent.trim().slice(0, 30)}"`);
  }
  for (const el of document.querySelectorAll(".advisor-page .mk-button")) if (shown(el) && getComputedStyle(el).color !== "rgb(16, 18, 14)") v.push(`orange button label not #10120E: ${getComputedStyle(el).color}`);
  const family = getComputedStyle(document.querySelector("#advisor-composer")).fontFamily;
  if (/DM Sans/.test(family)) v.push(`composer still uses DM Sans: ${family}`);
  if (getComputedStyle(document.documentElement).colorScheme !== "light") v.push("html color-scheme is not light on /advisor");
  return { violations: v, transcriptHeight, header: header && header.height };
}

(async () => {
  const channel = process.env.PW_CHANNEL === "bundled" ? undefined : (process.env.PW_CHANNEL || "chrome");
  const browser = await chromium.launch({ channel });
  const report = [];
  const viewports = [[1440, 900], [1024, 768], [390, 844], [320, 568]];
  const runs = [...viewports.map(([w, h]) => ({ w, h, fonts: true, motion: "no-preference" })),
    { w: 390, h: 844, fonts: false, motion: "no-preference" }, { w: 320, h: 568, fonts: false, motion: "no-preference" },
    { w: 390, h: 844, fonts: true, motion: "reduce" }];
  for (const run of runs) {
    const tag = `${run.w}x${run.h}${run.fonts ? "" : "-nofonts"}${run.motion === "reduce" ? "-reduced" : ""}`;
    const context = await browser.newContext({ viewport: { width: run.w, height: run.h }, reducedMotion: run.motion, isMobile: run.w < 768, hasTouch: run.w < 768 });
    let mode = "ok";
    await context.route("**/api/**", async (route) => {
      if (mode === "503") return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "OpenRouter is not configured on the server." }) });
      if (mode === "slow") { await new Promise((r) => setTimeout(r, 5000)); return route.fulfill({ status: 200, headers: { "content-type": "text/event-stream" }, body: sse(REPLY) }).catch(() => {}); }
      return route.fulfill({ status: 200, headers: { "content-type": "text/event-stream" }, body: sse(REPLY) });
    });
    if (!run.fonts) await context.route(/\.(woff2?|ttf|otf)(\?.*)?$/, (route) => route.abort());
    const page = await context.newPage();
    const shot = (state) => page.screenshot({ path: path.join(outDir, `${tag}-${state}.png`) });
    const record = async (state) => { const m = await page.evaluate(measure); report.push({ tag, state, ...m }); await shot(state); };
    const composer = page.locator("#advisor-composer");
    const send = page.getByRole("button", { name: "Send message" });

    await page.goto(`${baseUrl}/advisor?idea=${encodeURIComponent("ঢাকায় bakery & coffee? I have ৳2 lakh.")}`);
    await composer.waitFor();
    await page.waitForTimeout(700);
    await record("empty-prefill");

    const focus = [];
    for (let i = 0; i < 30; i += 1) {
      await page.keyboard.press("Tab");
      const f = await page.evaluate(() => { const el = document.activeElement; if (!el || el === document.body || !el.closest(".advisor-page")) return null;
        const cs = getComputedStyle(el); return { name: el.getAttribute("aria-label") || el.textContent.trim().slice(0, 30) || el.tagName, outline: `${cs.outlineStyle} ${cs.outlineWidth}` }; });
      if (f) focus.push(f);
    }
    report.push({ tag, state: "focus-walk", violations: focus.filter((f) => f.outline !== "solid 3px").map((f) => `focus ring missing on "${f.name}" (${f.outline})`), visited: focus.map((f) => f.name) });

    await composer.fill(LONG);
    await send.click();
    await page.waitForFunction(() => !document.querySelector("#advisor-composer").disabled && document.body.textContent.includes("verify locally"));
    await composer.fill("Second question about rent");
    await send.click();
    await page.waitForTimeout(800);
    await record("conversation");

    mode = "503";
    await composer.fill("Question that will fail");
    await send.click();
    await page.getByRole("alert").waitFor();
    await record("error-503");

    mode = "slow";
    await composer.fill("Slow question");
    await send.click();
    await page.getByRole("button", { name: "Stop response" }).waitFor();
    const dots = await page.evaluate(() => { const d = document.querySelector(".adv-thinking-dots i"); return d ? getComputedStyle(d).animationName : "missing"; });
    await record("pending");
    report.push({ tag, state: "thinking-animation", violations: run.motion === "reduce" && dots !== "none" ? [`thinking dots animate under reduced motion (${dots})`] : [], dots });
    await page.getByRole("button", { name: "Stop response" }).click();
    await page.getByRole("alert").waitFor();

    if (run.w < 1024) {
      const toggle = page.getByRole("button", { name: /^Notes/ });
      await toggle.click();
      const dialog = page.getByRole("dialog", { name: "Pinned notes" });
      const v = [];
      if (!(await dialog.count())) v.push("drawer has no dialog role/name");
      const panel = await page.evaluate(() => { const p = document.querySelector(".adv-drawer-panel"); return p ? p.getBoundingClientRect().toJSON() : null; });
      if (!panel || panel.width > run.w || panel.right > run.w + 0.5) v.push("drawer panel exceeds viewport");
      if (oq1) {
        if (!(await page.evaluate(() => Boolean(document.activeElement && document.activeElement.closest(".adv-drawer"))))) v.push("focus not moved into drawer on open");
      }
      await record("drawer-open");
      if (oq1) {
        await page.keyboard.press("Escape");
        await page.waitForTimeout(300);
        if (await dialog.count()) v.push("Escape did not close drawer");
        const name = await page.evaluate(() => document.activeElement && document.activeElement.textContent.replace(/\s+/g, " ").trim());
        if (!/^Notes/.test(name || "")) v.push(`focus not returned to Notes button (got "${name}")`);
      }
      report.push({ tag, state: "drawer", violations: v });
    }
    await context.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(outDir, "metrics.json"), JSON.stringify(report, null, 2));
  const all = report.flatMap((r) => (r.violations || []).map((x) => `${r.tag} ${r.state}: ${x}`));
  all.forEach((line) => console.log("VIOLATION " + line));
  console.log(all.length ? `FAIL (${all.length})` : "PASS");
  process.exit(all.length ? 1 : 0);
})().catch((error) => { console.error(error); process.exit(1); });
```

---

### Task 1 [shared]: Extract the shared Paper Arcade layer and capture baselines

**Tier:** standard `frontend-developer` (sonnet).
- The CSS move itself is mechanical.
- This task also builds and validates the tooling and baselines that every later proof depends on. A bad baseline would poison Tasks 2–4.
- Do not use the quick tier.

**Depends on:** nothing. **Blocks:** Tasks 2, 3, and 4. It must pass review before Task 2 starts.

**Files:**
- Create `app/paper-arcade.css` and `app/paper-arcade-fonts.ts`.
- Modify `app/marketing.css`, `app/layout.tsx`, and `app/page.tsx`.
- Evidence goes in `.agency/advisor-paper-arcade/evidence/`.

**Interfaces produced:**
- `paperArcadeFontVariables: string`, exported from `app/paper-arcade-fonts.ts`. Import it as `@/app/paper-arcade-fonts`.
- The `.advisor-page` root receives every `--mk-*` token plus the same root declarations as `.marketing-page`: paper background, ink colour, `color-scheme: light`, sans font, 16px/1.6, `min-height: 100dvh`, `overflow-x: clip`.
- `.advisor-page ::selection`, `.advisor-page :focus-visible`, and `.advisor-page .mk-input:focus-visible` behave exactly like their `.marketing-page` versions.
- Shared classes defined **only** in `app/paper-arcade.css`, loaded on every route from the root layout: `.mk-container`, `.mk-section`, `.mk-hero-title`, `.mk-h2`, `.mk-h3`, `.mk-accent`, `.mk-slab`, `.mk-slab-italic`, `.mk-eyebrow`, `.mk-emphasis`, `.mk-lead`, `.mk-body`, `.mk-label`, `.mk-number`, `.mk-panel`, `.mk-panel--sage`, `.mk-panel--yellow`, `.mk-panel--compact`, `.mk-chip`, `.mk-button`, `.mk-button-secondary`, `.mk-icon-button`, `.mk-nav-link`, `.mk-field-shell`, `.mk-input`, `.mk-error`, `.mk-wordmark`, `.mk-wordmark-ai`, `.mk-sr-only`, and `@property --mk-shadow`.

- [ ] **Step 1: Baselines on the untouched base.**
  - Confirm HEAD equals BASE and that the working tree has no source edits.
  - Set up the tooling (see "Verification tooling").
  - Build, then run `next start -p 3201`.
  - Run Script B twice, writing `evidence/baseline-behaviour.json` and `evidence/baseline-behaviour-run2.json`. Then run Script C on the pair. It **must print PASS** (this proves the harness is deterministic). If it does not, fix the harness's waits, not the app, and re-run.
  - Run Script D `home`, writing `evidence/baseline-home.json`. Run Script D `home --via-nav`, writing `evidence/baseline-home-vianav.json`.
  - Stop the server and restore `next-env.d.ts`.
  - If a harness step cannot pass against the base markup, report it as `NEEDS_CONTEXT` with the error. Do not edit the advisor to make it pass.
- [ ] **Step 2: Create `app/paper-arcade.css`.**
  - Start the file with this comment:

    ```css
    /*
     * BizGuide AI - Paper Arcade shared theme layer.
     * Contract: docs/superpowers/specs/2026-10-19-homepage-theme.md (advisor use: 2026-10-19-advisor-paper-arcade-design.md)
     *
     * Imported ONCE from app/layout.tsx so a single copy is always ordered before page CSS. Do not import per page:
     * React keeps stylesheets after client navigation, and a second copy loaded after marketing.css would override
     * equal-specificity homepage modifiers. Tokens and root styling apply only under .marketing-page / .advisor-page;
     * the mk-* primitives only match elements that opt in, so other routes are unaffected.
     */
    ```

  - Then move these blocks out of base `app/marketing.css`, verbatim, in this order. Line numbers refer to the BASE version.
    1. Lines 11–16: the `@property --mk-shadow` comment and rule.
    2. Lines 18–52: the root block. Change only its selector line, from `.marketing-page {` to the two lines `.marketing-page,` and `.advisor-page {`.
    3. Lines 54–57: selection. Change the selector to `.marketing-page ::selection,` / `.advisor-page ::selection {`.
    4. Lines 59–65: the focus comment and rule. Change the selector to `.marketing-page :focus-visible,` / `.advisor-page :focus-visible {`.
    5. Lines 74–402: the Layout, Typography, Surfaces, Controls, Field, and Error sections. Change only line 388, from `.marketing-page .mk-input:focus-visible {` to `.marketing-page .mk-input:focus-visible,` / `.advisor-page .mk-input:focus-visible {`.
    6. Lines 506–530: `.mk-wordmark` and `.mk-wordmark-ai`, preceded by a new comment line `/* ---------- Wordmark ---------- */`.
    7. Lines 649–659: `.mk-sr-only`, preceded by a new comment line `/* ---------- Utilities ---------- */`.
- [ ] **Step 3: Trim `app/marketing.css`.**
  - Delete exactly the moved lines. Keep lines 67–72 (the `.marketing-page .mk-main` focus rule), which becomes the first rule.
  - Replace the header comment (lines 1–9) with:

    ```css
    /*
     * BizGuide AI - Paper Arcade homepage sections.
     * Tokens, focus ring, and shared primitives (buttons, labels, panels, wordmark, sr-only) live in
     * app/paper-arcade.css, which the root layout loads before this file. Everything here is homepage-only.
     */
    ```

  - Change nothing else: the reduced-motion block, the header, and all sections stay where they are.
  - **Why this order is safe:** at base, every moved rule sat before every rule that stays, except the wordmark and sr-only blocks. A grep shows no remaining rule between their old and new positions targets `.mk-wordmark*` or `.mk-sr-only` elements: overrides such as `.mk-footer .mk-wordmark` have higher specificity, and `.mk-stepnav-link` comes later. Confirm this with `grep -n "wordmark\|mk-sr-only" app/marketing.css` and cite the output in your report.
- [ ] **Step 4: Fonts definitions file.** Create `app/paper-arcade-fonts.ts`. The options are copied exactly from base `app/page.tsx`.

  ```ts
  import { IBM_Plex_Mono, Josefin_Slab, Space_Grotesk } from "next/font/google";

  // Font definitions file (Next docs: load each font once, import where needed). Self-hosted at build time with
  // font-display: swap; the CSS stacks in app/paper-arcade.css fall back to Arial / ui-monospace / Georgia.
  const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "700"], display: "swap", variable: "--font-mk-sans" });
  const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], display: "swap", variable: "--font-mk-mono" });
  const josefinSlab = Josefin_Slab({ subsets: ["latin"], style: ["normal", "italic"], display: "swap", variable: "--font-mk-slab", fallback: ["Georgia", "serif"] });

  export const paperArcadeFontVariables = `${spaceGrotesk.variable} ${plexMono.variable} ${josefinSlab.variable}`;
  ```

  In `app/page.tsx`:
  - Delete line 3 (the `next/font/google` import) and lines 14–17 (the comment and three font constants).
  - Add `import { paperArcadeFontVariables } from "@/app/paper-arcade-fonts";` after the `./marketing.css` import.
  - Change line 21 to `<div className={`marketing-page ${paperArcadeFontVariables}`}>`.
  - Nothing else changes.
- [ ] **Step 5: Root layout.** In `app/layout.tsx`, add `import "./paper-arcade.css";` on the line after `import "./globals.css";`. Nothing else changes.
- [ ] **Step 6: Mechanical move proof.** Save this as `SCRATCH/advisor-tools/move-proof.cjs` and run `node SCRATCH/advisor-tools/move-proof.cjs <BASE>` from the repo root.

  ```js
  "use strict";
  const { execSync } = require("node:child_process");
  const fs = require("node:fs");
  const base = process.argv[2];
  const tally = (lines) => lines.reduce((m, l) => (l.trim() ? m.set(l, (m.get(l) || 0) + 1) : m), new Map());
  const before = tally(execSync(`git show ${base}:app/marketing.css`, { encoding: "utf8" }).split(/\r?\n/).slice(9));
  const after = tally([...fs.readFileSync("app/paper-arcade.css", "utf8").split(/\r?\n/), ...fs.readFileSync("app/marketing.css", "utf8").split(/\r?\n/)]);
  for (const line of new Set([...before.keys(), ...after.keys()])) {
    const d = (after.get(line) || 0) - (before.get(line) || 0);
    if (d) console.log(`${d > 0 ? "+" : "-"}${Math.abs(d)}  ${line}`);
  }
  ```

  The expected output contains **only**:
  - `-1` for each of the 4 original selector lines (`.marketing-page {`, `.marketing-page ::selection {`, `.marketing-page :focus-visible {`, `.marketing-page .mk-input:focus-visible {`);
  - `+1` for each of their 8 replacement lines;
  - the lines of the two new header comments and the two new section-heading comments.

  Paste the full output into your report. Anything else means a non-verbatim move: fix it.
- [ ] **Step 7: Prove the homepage did not change.**
  - Build, then run `next start -p 3202`.
  - Run Script D `home`, writing `evidence/t1-home.json`, and Script D `home --via-nav`, writing `evidence/t1-home-vianav.json`.
  - Compare each with its baseline using Script C. Expected: `PASS`.
  - Run Script B, writing `evidence/t1-behaviour.json`, and compare it with `baseline-behaviour.json` with no allow-list. Expected: `PASS` (the advisor is untouched).
  - Run Script A with `<BASE>`. Expected: `PASS`.
  - If a style diff is only a font-family hash the normaliser missed, report it verbatim for the reviewer to adjudicate. Any other diff means the move broke the cascade: fix it.
- [ ] **Step 8: Checks.**
  - `npm run lint`, `npm run typecheck`, and `npm run build` must each exit 0. Record the real output.
  - Restore `next-env.d.ts`.
  - `git status --short` must show only the 5 task files plus the user's pre-existing items.
- [ ] **Step 9: Commit.** Run `git add app/paper-arcade.css app/paper-arcade-fonts.ts app/marketing.css app/layout.tsx app/page.tsx`, then commit with the message `refactor: share Paper Arcade tokens and primitives`.
- [ ] **Report:**
  - BASE and the new SHA;
  - the move-proof output and the Step 3 grep output;
  - the Script A, B/C, and D/C results with file names;
  - the lint/typecheck/build results;
  - anything not verified.

**Reviewer focus for Task 1:**
- The move is verbatim: check the move-proof output and `git diff --color-moved=zebra <BASE> -- app/marketing.css app/paper-arcade.css`.
- The paper-arcade import is in the root layout, not per page.
- No homepage computed-style diff.
- The font options are byte-identical to base.

---

### Task 2 [frontend]: Advisor shell, header, transcript frame, composer, states, and drawer

**Tier:** standard `frontend-developer` (sonnet). It covers multiple files, a new stylesheet, responsive judgement, and the behaviour-preservation discipline.

**Depends on:** Task 1 reviewed and committed. **Blocks:** Task 3.

**Files:**
- Modify `app/advisor/page.tsx` and `components/advisor-experience.tsx`.
- Create `app/advisor/advisor.css`, containing the Shell section plus an empty Task 3 marker.
- Do **not** touch `components/advisor-message.tsx` or `components/pinned-notes.tsx`. They stay dark-styled until Task 3, which is expected in this intermediate commit.

**Interfaces consumed:**
- `paperArcadeFontVariables` (from `@/app/paper-arcade-fonts`);
- the shared classes from Task 1;
- `MarketingBrand()` (from `@/components/marketing/marketing-brand`, unchanged);
- `AdvisorMessageCard` and `PinnedNotes`, whose props are unchanged.

**Interfaces produced (used by Task 3):**
- Root wrapper: `.advisor-page`.
- Shell classes: `adv-shell`, `adv-header`, `adv-header-bar`, `adv-header-brand`, `adv-header-tag`, `adv-header-actions`, `adv-header-button`, `adv-collapse-label`, `adv-notes-toggle`, `adv-count`, `adv-body`, `adv-chat`, `adv-transcript`, `adv-transcript-inner`, `adv-starters`, `adv-starters-title`, `adv-starter-grid`, `adv-starter`, `adv-composer-bar`, `adv-composer-inner`, `adv-alert`, `adv-alert-text`, `adv-alert-retry`, `adv-prefill`, `adv-composer`, `adv-composer-input`, `adv-composer-footer`, `adv-composer-hint`, `adv-composer-hint--keys`, `adv-send`, `adv-stop`, `adv-disclaimer`, `adv-sidebar`, `adv-drawer`, `adv-drawer-scrim`, `adv-drawer-panel`, `adv-toast`, `adv-loading`.
- Task 3 renders `PinnedNotes` inside `.adv-sidebar` and `.adv-drawer-panel`. Its root must fill the container's height.

- [ ] **Step 1: Pre-change check.**
  - Run Script E against the current build and keep its output as evidence of the old failures (`evidence/t2-before/`). Expected failures: dark colour-scheme, DM Sans, small targets, body scroll at 320x568, and New plan unreachable on mobile.
  - Run Script A with `<BASE>`. It must print `PASS` before you start.
- [ ] **Step 2: `app/advisor/page.tsx`.** Replace the whole file with:

  ```tsx
  import "./advisor.css";
  import { Suspense } from "react";
  import { paperArcadeFontVariables } from "@/app/paper-arcade-fonts";
  import { AdvisorExperience } from "@/components/advisor-experience";

  export default function AdvisorPage() {
    return (
      <div className={`advisor-page ${paperArcadeFontVariables}`}>
        <Suspense fallback={<p className="adv-loading" role="status">Loading the advisor workspace…</p>}>
          <AdvisorExperience />
        </Suspense>
      </div>
    );
  }
  ```

- [ ] **Step 3: `components/advisor-experience.tsx` imports.** Lines 3–12 become the block below. `Image` and `Brand` are removed; `TriangleAlert` and `MarketingBrand` are added. Lines 8–9 keep their exact text.

  ```tsx
  import Link from "next/link";
  import { useSearchParams } from "next/navigation";
  import { ArrowLeft, Check, Lightbulb, NotebookPen, RotateCcw, Send, Square, TriangleAlert } from "lucide-react";
  import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
  import { ADVISOR_WELCOME } from "@/lib/advisor-prompt";
  import type { ChatMessage, PinnedNote } from "@/types/advisor";
  import { AdvisorMessageCard } from "./advisor-message";
  import { MarketingBrand } from "./marketing/marketing-brand";
  import { PinnedNotes } from "./pinned-notes";
  ```

- [ ] **Step 4: Leave lines 14–153 untouched.** That runs from `const PIN_STORAGE_KEY` through `function retry`.
  - The **only** exception, and only if OQ1 is approved, is line 62. It becomes exactly:

    ```tsx
        scrollAnchorRef.current?.scrollIntoView({ behavior: sending && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "auto", block: "end" });
    ```

  - Insert this block immediately after `function retry` and before `return (`:

    ```tsx
      // Render-only values derived from existing state; they add no behaviour.
      const liveStatus = sending ? "BizGuide is writing a reply." : messages.length > 1 && messages[messages.length - 1].role === "assistant" ? "BizGuide replied." : "";
      const showPrefill = initialIdea.length > 0 && draft === initialIdea && messages.length === 1;
      // OQ1 (UI-only): send focus back to the Notes button when the drawer closes.
      const notesToggleRef = useRef<HTMLButtonElement>(null);
      function closeNotes() { setNotesOpen(false); notesToggleRef.current?.focus(); }
    ```

    If OQ1 is **not** approved, omit the last three lines. In the JSX below, then use `() => setNotesOpen(false)` wherever `closeNotes` appears (keeping the base's exact text for `onClick` and `onClose`), and drop `ref={notesToggleRef}` and the dialog `onKeyDown`.
- [ ] **Step 5: Replace the returned JSX** (base lines 155–186) with this exact structure. Attribute values marked as protected in Script A must keep their base text and attribute order.

  ```tsx
    return (
      <div className="adv-shell">
        <header className="adv-header">
          <div className="adv-header-bar">
            <div className="adv-header-brand">
              <MarketingBrand />
              <p className="mk-label adv-header-tag">Bangladesh business advisor</p>
            </div>
            <div className="adv-header-actions">
              <button type="button" onClick={resetChat} className="mk-button-secondary adv-header-button"><RotateCcw size={18} strokeWidth={2.5} aria-hidden="true" /><span className="adv-collapse-label">New plan</span></button>
              <button ref={notesToggleRef} type="button" onClick={() => setNotesOpen(true)} className="mk-button-secondary adv-header-button adv-notes-toggle" aria-haspopup="dialog" aria-expanded={notesOpen}><NotebookPen size={18} strokeWidth={2.5} aria-hidden="true" /><span className="adv-collapse-label">Notes</span>{pins.length > 0 && <span className="adv-count"><span className="mk-sr-only">, </span>{pins.length}<span className="mk-sr-only"> saved</span></span>}</button>
              <Link href="/" className="mk-button-secondary adv-header-button" aria-label="Back to homepage"><ArrowLeft size={18} strokeWidth={2.5} aria-hidden="true" /><span className="adv-collapse-label">Back to home</span></Link>
            </div>
          </div>
        </header>

        <div className="adv-body">
          <main className="adv-chat">
            <h1 className="mk-sr-only">BizGuide AI business advisor</h1>
            <section className="adv-transcript" aria-label="Conversation" tabIndex={0}>
              <div className="adv-transcript-inner">
                {messages.map((message) => <AdvisorMessageCard key={message.id} message={message} onPin={addPin} pinnedTexts={pinnedTexts} />)}
                {messages.length === 1 && <section className="adv-starters" aria-labelledby="adv-starters-title"><h2 id="adv-starters-title" className="mk-label adv-starters-title"><Lightbulb size={16} strokeWidth={2.5} aria-hidden="true" /> Try a planning prompt</h2><div className="adv-starter-grid">{starters.map((starter) => <button key={starter} type="button" onClick={() => void requestAdvice(starter)} className="mk-button-secondary adv-starter">{starter}</button>)}</div></section>}
                <div ref={scrollAnchorRef} />
              </div>
            </section>
            <p className="mk-sr-only" role="status">{liveStatus}</p>

            <div className="adv-composer-bar">
              <div className="adv-composer-inner">
                {error && <div className="adv-alert" role="alert"><TriangleAlert size={18} strokeWidth={2.5} aria-hidden="true" /><p className="adv-alert-text">{error}</p>{lastUserText && !sending && <button type="button" onClick={retry} className="mk-button-secondary adv-alert-retry">Retry</button>}</div>}
                {showPrefill && <p id="adv-prefill-note" className="adv-prefill"><span className="mk-label">From the homepage</span> Your idea is in the message box. Edit it, then press Send. Nothing is sent until you do.</p>}
                <form onSubmit={submit} className="adv-composer">
                  <label htmlFor="advisor-composer" className="mk-sr-only">Ask BizGuide AI</label>
                  <textarea ref={composerRef} id="advisor-composer" value={draft} onChange={(event) => { setDraft(event.target.value); setError(""); }} onKeyDown={handleKeyDown} rows={2} maxLength={4000} placeholder={sending ? "BizGuide is replying… press Stop to interrupt." : "Describe your idea, location, budget, or ask your next business question…"} disabled={sending} aria-describedby={showPrefill ? "adv-composer-hint adv-prefill-note" : "adv-composer-hint"} className="adv-composer-input" />
                  <div className="adv-composer-footer">
                    {sending ? <p id="adv-composer-hint" className="adv-composer-hint">BizGuide is replying…</p> : <p id="adv-composer-hint" className="adv-composer-hint adv-composer-hint--keys">Enter to send · Shift + Enter for a new line</p>}
                    {sending ? <button type="button" onClick={stop} className="mk-button-secondary adv-stop" aria-label="Stop response"><Square size={14} strokeWidth={2.5} fill="currentColor" aria-hidden="true" /> Stop</button> : <button type="submit" disabled={!draft.trim()} className="mk-button adv-send" aria-label="Send message"><Send size={18} strokeWidth={2.5} aria-hidden="true" /> Send</button>}
                  </div>
                </form>
                <p className="adv-disclaimer">BizGuide can make mistakes. Verify legal, financial, pricing, and local market details with current official sources.</p>
              </div>
            </div>
          </main>

          <div className="adv-sidebar"><PinnedNotes notes={pins} onAdd={(text) => addPin(text)} onUpdate={updatePin} onRemove={removePin} /></div>
        </div>

        {notesOpen && <div className="adv-drawer" role="dialog" aria-modal="true" aria-label="Pinned notes" onKeyDown={(event) => { if (event.key === "Escape") closeNotes(); }}><button type="button" className="adv-drawer-scrim" onClick={closeNotes} aria-label="Close notes overlay" tabIndex={-1} /><div className="adv-drawer-panel"><PinnedNotes notes={pins} onAdd={(text) => addPin(text)} onUpdate={updatePin} onRemove={removePin} onClose={closeNotes} /></div></div>}
        {pinNotice && <div className="adv-toast" role="status"><Check size={16} strokeWidth={2.5} aria-hidden="true" />{pinNotice}</div>}
      </div>
    );
  ```

  Notes on this markup:
  - **No Tailwind classes remain.** `fill="currentColor"` replaces `fill-current`.
  - **Accessible names hold.** "Stop" is contained in "Stop response". "Send" is contained in "Send message". "Back to home" is contained in "Back to homepage".
  - **The scrim's `tabIndex={-1}`** removes a duplicate tab stop; the panel's close button is the keyboard path.
- [ ] **Step 6: Create `app/advisor/advisor.css`.**
  - Open the file with a header comment (scope rule plus the focus-ring rule from Global Constraint 5), then `/* ---------- Shell (Task 2) ---------- */`.
  - End it with the marker line `/* ---------- Messages and notes (Task 3) ---------- */` and nothing after it.
  - Every selector is prefixed `.advisor-page` (written below without the prefix for brevity). Breakpoints: `640px`, `768px`, `1024px`, `1280px`, and `max-width: 399px` for the tightest phones.

  | Selector | Required declarations |
  | --- | --- |
  | `:root:has(.advisor-page)` | `color-scheme: light; background-color: #f4ebdd;` (comment: `= --mk-paper; tokens are not in scope at :root`) |
  | `:root:has(.advisor-page) body` | `background-color: #f4ebdd;` |
  | `.adv-loading` | `display: grid; place-items: center; min-height: 100dvh; margin: 0;` mono 14px/1.4 weight 500, uppercase, `letter-spacing: 0.06em` |
  | `.adv-shell` | `display: grid; grid-template-rows: auto minmax(0, 1fr); height: 100vh; height: 100dvh; overflow: hidden;` (no `min-height`) |
  | `.adv-header` | `border-bottom: var(--mk-border); background: var(--mk-paper); padding-top: env(safe-area-inset-top, 0px);` |
  | `.adv-header-bar` | `display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 72px;` and inline padding `max(24px, env(safe-area-inset-left, 0px))` / `max(24px, env(safe-area-inset-right, 0px))`. Below 768px: `min-height: 60px; gap: 8px;` inline padding 16px (same `max()` form). Below 400px: inline padding 12px. |
  | `.adv-header-brand` | `display: flex; align-items: center; gap: 16px; min-width: 0;` |
  | `.adv-header-tag` | `display: none; margin: 0; padding-left: 16px; border-left: var(--mk-border);`. At 1024px and wider: `display: block`. |
  | `.adv-header .mk-wordmark` | Below 400px: `font-size: 1.125rem; gap: 6px;` |
  | `.adv-header-actions` | `display: flex; align-items: center; gap: 12px; flex: none;`. Below 768px: `gap: 6px`. |
  | `.adv-header-button` | `padding: 0 16px; gap: 8px; position: relative;`. Below 768px: `width: 44px; min-height: 44px; height: 44px; padding: 0; gap: 0;` |
  | `.adv-collapse-label` | Below 768px only: the visually-hidden pattern (`position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;`). The text must stay in the accessible name; never use `display: none`. |
  | `.adv-count` | `display: inline-grid; place-items: center; min-width: 22px; height: 22px; padding: 0 4px; border-radius: var(--mk-radius); background: var(--mk-ink); color: var(--mk-paper);` mono 12px weight 500 `line-height: 1`. Below 768px: `position: absolute; top: -8px; right: -8px; border: 2px solid var(--mk-paper);` |
  | `.adv-notes-toggle` | At 1024px and wider: `display: none`. |
  | `.adv-body` | `display: grid; grid-template-columns: minmax(0, 1fr); min-height: 0;`. At 1024px and wider: `minmax(0, 1fr) 340px`. At 1280px and wider: `minmax(0, 1fr) 380px`. |
  | `.adv-chat` | `display: grid; grid-template-rows: minmax(0, 1fr) auto; min-height: 0; min-width: 0;` |
  | `.adv-transcript` | `min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-gutter: stable;` |
  | `.adv-transcript:focus-visible` | `outline-offset: -4px; box-shadow: none;` (inset ring; the container clips an outer ring) |
  | `.adv-transcript-inner` | `display: grid; align-content: start; gap: 20px; width: min(820px, 100%); margin-inline: auto; padding: 32px 24px 40px;`. Below 768px: `padding: 20px 16px 28px; gap: 16px;`. Below 400px: inline padding 12px. |
  | `.adv-starters` | `display: grid; gap: 12px; margin-top: 4px;` |
  | `.adv-starters-title` | `display: inline-flex; align-items: center; gap: 8px; margin: 0;` (`.mk-label` already sets the mono font, letter-spacing, and line-height, which defeats the global `h2` Manrope rule) |
  | `.adv-starter-grid` | `display: grid; gap: 12px;`. At 640px and wider: `grid-template-columns: repeat(2, minmax(0, 1fr));` |
  | `.adv-starter` | `width: 100%; height: auto; min-height: 56px; justify-content: flex-start; padding: 12px 16px; text-align: left; white-space: normal; text-transform: none; letter-spacing: 0; font-family: var(--mk-font-sans); font-size: 15px; font-weight: 500; line-height: 1.4;` |
  | `.adv-composer-bar` | `border-top: var(--mk-border); background: var(--mk-paper); padding: 16px 24px max(16px, env(safe-area-inset-bottom, 0px));`. Below 768px: `padding: 12px 12px max(12px, env(safe-area-inset-bottom, 0px));` |
  | `.adv-composer-inner` | `display: grid; gap: 10px; width: min(820px, 100%); margin-inline: auto;` |
  | `.adv-alert` | `display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; border: var(--mk-border); border-left: 8px solid var(--mk-orange); border-radius: var(--mk-radius); background: var(--mk-paper); padding: 8px 8px 8px 12px; font-weight: 500;` |
  | `.adv-alert svg` | `flex: none;` |
  | `.adv-alert-text` | `flex: 1 1 12rem; min-width: 0; margin: 0; overflow-wrap: anywhere;` |
  | `.adv-alert-retry` | `padding: 0 16px;` |
  | `.adv-prefill` | `margin: 0; border: 2px dashed var(--mk-ink); border-radius: var(--mk-radius); background: var(--mk-yellow); padding: 8px 12px; font-size: 14px; line-height: 1.5;` and `.adv-prefill .mk-label { margin-right: 8px; }` |
  | `.adv-composer` | `--mk-shadow: var(--mk-shadow-compact); border: var(--mk-border); border-radius: var(--mk-radius); background: var(--mk-paper); box-shadow: var(--mk-shadow);` (the form is not focusable, so this is allowed) |
  | `.adv-composer:focus-within` | `outline: 3px solid var(--mk-ink); outline-offset: 3px; box-shadow: 0 0 0 3px var(--mk-paper), var(--mk-shadow);` |
  | `.adv-composer:has(.adv-composer-input:disabled)` | `border-style: dashed; box-shadow: none;` |
  | `.adv-composer-input` | `display: block; width: 100%; min-height: 56px; max-height: 160px; resize: none; border: 0; border-radius: var(--mk-radius); background: transparent; padding: 12px 14px; color: var(--mk-ink); font-family: var(--mk-font-sans); font-size: 16px; line-height: 1.5;`. With `max-height: 640px` (viewport height): `max-height: 112px;` |
  | `.adv-composer-input::placeholder` | `color: var(--mk-ink); opacity: 0.75;` |
  | `.adv-composer-input:disabled` | `cursor: progress; opacity: 1; -webkit-text-fill-color: var(--mk-ink);` |
  | `.adv-composer-input:focus-visible` | `outline: 3px solid var(--mk-ink); outline-offset: -3px; box-shadow: none;` |
  | `.adv-composer-footer` | `display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 6px 6px 14px;` |
  | `.adv-composer-hint` | `margin: 0; min-width: 0;` mono 12px/1.5 weight 500, `letter-spacing: 0.02em` |
  | `.adv-composer-hint--keys` | With `(max-width: 767px) and (pointer: coarse)`: `display: none` (it still describes the textarea through `aria-describedby`). |
  | `.adv-send` | `margin-left: auto; padding: 0 20px;` |
  | `.adv-send:disabled` | `--mk-shadow: none; border-style: dashed; transform: none;` (the `:disabled` exception) |
  | `.adv-stop` | `margin-left: auto; padding: 0 16px;` |
  | `.adv-disclaimer` | `margin: 0; text-align: center; font-size: 12px; line-height: 1.5;`. Below 400px: `text-align: left`. |
  | `.adv-sidebar` | `display: none; min-height: 0;`. At 1024px and wider: `display: block; border-left: var(--mk-border); overflow: hidden;` |
  | `.adv-drawer` | `position: fixed; inset: 0; z-index: 50;`. At 1024px and wider: `display: none`. |
  | `.adv-drawer-scrim` | `position: absolute; inset: 0; border: 0; padding: 0; background: rgb(37 40 32 / 0.55); cursor: pointer;` (the rgb value is ink at 55%; comment it) |
  | `.adv-drawer-panel` | `position: absolute; top: 0; right: 0; bottom: 0; width: min(92vw, 380px); border-left: var(--mk-border); background: var(--mk-yellow); padding-top: env(safe-area-inset-top, 0px); padding-right: env(safe-area-inset-right, 0px); animation: adv-drawer-in var(--mk-t-reveal) var(--mk-ease);` |
  | `@keyframes adv-drawer-in` | `from { transform: translateX(16px); opacity: 0; } to { transform: none; opacity: 1; }` |
  | `.adv-toast` | `position: fixed; z-index: 60; top: calc(84px + env(safe-area-inset-top, 0px)); left: 50%; transform: translateX(-50%); display: inline-flex; align-items: center; gap: 8px; max-width: calc(100vw - 32px); min-height: 40px; padding: 0 16px; border: 2px solid var(--mk-ink); border-radius: var(--mk-radius); background: var(--mk-ink); color: var(--mk-paper);` mono 14px weight 500 uppercase. Below 768px: `top: calc(72px + env(safe-area-inset-top, 0px));` |
  | Reduced motion (`@media (prefers-reduced-motion: reduce)`) | `.advisor-page .adv-drawer-panel { animation: none; }` |

  Set no `transition` on shared controls: they already carry the 140ms tokens.

  Header width budget at 320px:
  - Available space: 320 − 24 = 296px.
  - Contents: wordmark (~135px at 1.125rem), plus 3 × 44px icon buttons, plus 3 × 6px gaps, which comes to about 285px.
  - If fallback fonts overflow, you may reduce the wordmark further (down to 1rem) in the 399px query. Do not drop a control.
- [ ] **Step 7: Verify.** On a fresh build, run `next start -p 3203`.
  - Run Script A with `<BASE>`, adding `--oq1` if approved. Expected: `PASS`. Also run `git diff --name-only <T1_SHA> -- app/marketing.css app/page.tsx app/layout.tsx app/paper-arcade.css app/paper-arcade-fonts.ts`. Expected: empty.
  - Run Script B, writing `evidence/t2-behaviour.json`, then Script C against `baseline-behaviour.json` with the Task 2 allow-list (OQ1-dependent). Expected: `PASS`.
  - Run Script E, writing to `evidence/t2-metrics/`. Expected: no violations outside `.adv-message`/`.adv-notes` (Task 3 styles those).
    - These must be clean: shell, header, composer, alert, starters, body scroll, horizontal overflow, focus walk (header, starters, composer, Send/Stop, Retry), drawer dialog, Escape, focus return.
    - Look at the PNGs for all four viewports and the no-fonts runs. Confirm visually: header fit, composer always visible, toast under the header, drawer width.
  - `npm run lint`, `npm run typecheck`, and `npm run build` must each exit 0. Restore `next-env.d.ts`.
- [ ] **Step 8: Commit.** Run `git add app/advisor/page.tsx app/advisor/advisor.css components/advisor-experience.tsx`, then commit with the message `feat: restyle advisor shell and composer in Paper Arcade`.
- [ ] **Report:**
  - the SHA;
  - the Script A, C, and E outputs, with the list of informational message/notes violations deferred to Task 3;
  - the screenshot file list;
  - the lint/typecheck/build results;
  - whether OQ1 items were included;
  - anything not verified (real iOS keyboard, Safari/Firefox, screen readers).

**Reviewer focus for Task 2:**
- Script A `PASS`.
- The returned JSX matches Step 5 exactly in its protected attributes.
- `advisor.css` follows the scope and focus-ring rules.
- 320x568 fits with fallback fonts.
- The drawer dialog semantics are correct.
- No Tailwind or homepage-only class remains in the two files.

---

### Task 3 [frontend]: Messages (markdown lines, pins, thinking) and the pinned-notes panel

**Tier:** standard `frontend-developer` (sonnet). The markup is fully specified here, but the CSS needs visual judgement and the protected-line discipline is strict. If the orchestrator wants to economise, this is the only task where `frontend-developer-quick` is defensible. Escalate on the first `NEEDS_CONTEXT`.

**Depends on:** Task 2 reviewed and committed. **Blocks:** Task 4.

**Files:**
- Modify `components/advisor-message.tsx` and `components/pinned-notes.tsx`.
- Modify `app/advisor/advisor.css`, **appending only below** the `/* ---------- Messages and notes (Task 3) ---------- */` marker. Lines above the marker belong to Task 2 and must not change.

**Interfaces:**
- **Unchanged props:**
  - `AdvisorMessageCard({ message, onPin, pinnedTexts }: { message: ChatMessage; onPin: (text: string, sourceMessageId: string) => void; pinnedTexts: Set<string> })`
  - `PinnedNotes({ notes, onAdd, onUpdate, onRemove, onClose }: { notes: PinnedNote[]; onAdd: (text: string) => void; onUpdate: (id: string, text: string) => void; onRemove: (id: string) => void; onClose?: () => void })`
- **Classes produced:** `adv-message`, `adv-message--assistant`, `adv-message--user`, `adv-message-meta`, `adv-message-badge`, `adv-message-body`, `adv-line`, `adv-line--pinnable`, `adv-md-heading`, `adv-md-p`, `adv-md-bullet`, `adv-md-marker`, `adv-md-gap`, `adv-md-strong`, `adv-pin`, `adv-pin--pinned`, `adv-thinking`, `adv-thinking-dots`, `adv-notes`, `adv-notes-head`, `adv-notes-heading`, `adv-notes-icon`, `adv-notes-title`, `adv-notes-count`, `adv-notes-close`, `adv-note-form`, `adv-note-form-row`, `adv-note-input`, `adv-note-add`, `adv-notes-list-wrap`, `adv-notes-list`, `adv-notes-empty`, `adv-notes-empty-title`, `adv-notes-empty-text`, `adv-note`, `adv-note-text`, `adv-note-foot`, `adv-note-actions`, `adv-note-action`, `adv-note-edit`, `adv-note-edit-actions`, `adv-note-btn`.

- [ ] **Step 1:** Run Script A (expected `PASS`) and keep the Task 2 metrics as the "before" for messages and notes.
- [ ] **Step 2: `components/advisor-message.tsx`.**
  - Line 4 becomes `import { Pin } from "lucide-react";`. Delete line 3 (`next/image`); `UserRound` and the avatars are removed.
  - Keep lines 5, 7, 9, 13–19, and 27–34 byte-identical.
  - Line 10 changes only its class: `<strong key={index} className="adv-md-strong">`.
  - Replace the returned JSX (lines 21–47) with:

  ```tsx
    return (
      <article className={`adv-message ${assistant ? "adv-message--assistant" : "adv-message--user"}`} aria-label={assistant ? "BizGuide AI message" : "Your message"} aria-busy={message.streaming ? true : undefined}>
        <div className="adv-message-meta" aria-hidden="true">
          {assistant ? <><span className="adv-message-badge">AI</span><span>BizGuide{message.streaming && message.content ? " · Writing…" : ""}</span></> : <span>You</span>}
        </div>
        {message.streaming && !message.content ? <div className="adv-thinking"><span className="adv-thinking-dots" aria-hidden="true"><i /><i /><i /></span><span className="mk-label">Thinking…</span></div> : (
          <div className="adv-message-body">
            {lines.map((line, index) => {
              const trimmed = line.trim();
              if (!trimmed) return <span key={index} className="adv-md-gap" />;
              const clean = cleanLine(trimmed);
              const heading = /^#{1,4}\s/.test(trimmed);
              const bullet = /^[-*]\s+/.test(trimmed);
              const numbered = /^\d+[.)]\s+/.test(trimmed);
              const pinned = pinnedTexts.has(clean.toLowerCase());
              return (
                <div key={`${index}-${clean.slice(0, 18)}`} className={assistant ? "adv-line adv-line--pinnable" : "adv-line"}>
                  {heading ? <h3 className="adv-md-heading"><InlineText text={clean} /></h3> : bullet || numbered ? <p className="adv-md-bullet"><span className="adv-md-marker" aria-hidden="true" /><span><InlineText text={clean} /></span></p> : <p className="adv-md-p"><InlineText text={trimmed} /></p>}
                  {assistant && clean.length > 8 && <button type="button" onClick={() => onPin(clean, message.id)} className={pinned ? "adv-pin adv-pin--pinned" : "adv-pin"} aria-label={pinned ? "This line is pinned" : "Pin this line"} title={pinned ? "Pinned" : "Pin this insight"}><Pin size={18} strokeWidth={2.5} fill={pinned ? "currentColor" : "none"} aria-hidden="true" /></button>}
                </div>
              );
            })}
          </div>
        )}
      </article>
    );
  ```

  The meta row is a `div`/`span`, never a `p` or `h3`. Script B reads message text from `h3, p`, so a `p` meta row would break baseline equality.
