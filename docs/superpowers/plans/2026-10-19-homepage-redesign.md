# BizGuide AI Homepage Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for native execution, or superpowers:subagent-driven-development if the user selects delegation. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Paper Arcade theme first, then redesign the homepage around truthful capabilities and a five-stage scroll-driven product walkthrough.

**Architecture:** Keep the homepage shell and informational sections server rendered. Isolate business-example state and the progressively enhanced process in focused client components. Scope all theme styling to the marketing root; preserve the existing advisor and backend.

**Tech Stack:** Existing Next.js, React, TypeScript, Tailwind CSS, Lucide, GSAP; add Anime.js for decorative detail animation during Task 4 only.

**Spec:** `docs/superpowers/specs/2026-10-19-homepage-redesign-design.md`.

**Theme:** `docs/superpowers/specs/2026-10-19-homepage-theme.md`.

**Status:** Awaiting user review of this written implementation plan. The user has approved the design and requested theme-first execution; implementation has not started.

## Global Constraints

- Paper `#F4EBDD`, ink `#252820`, orange `#D94F30`, sage `#B9C7A5`, yellow `#F2CE67`; orange normal-size labels use `#10120E` for contrast.
- Space Grotesk for headings/body, IBM Plex Mono for short labels and controls; fallbacks must remain readable.
- Scope typography and light color-scheme styling under the marketing root. Do not globally replace dark tokens or the advisor's fonts.
- Use native document scrolling and CSS sticky positioning. Do not intercept the wheel, force scroll snapping, or lock the page.
- Use the sticky diagram layout only at viewport widths of at least 1024px and heights of at least 720px when reduced motion is off.
- Persistent label: “Illustrative example — not a live AI response.”
- Example input: “I want to open a bakery in Dhaka with ৳2 lakh.”
- The demonstration is a fixed explanatory sequence. It must not require text submission, simulated waiting, external APIs, or actually saving sample notes.
- Keep a single authoritative active-stage value. Do not update React state for every scroll pixel.
- Never let the two libraries animate the same DOM element or CSS property owner.
- Existing local edits to `next-env.d.ts`, `package.json`, and `package-lock.json` must be preserved, including the user's Tailwind 4.3.3 update.
- No accounts, database, AI changes, deployment, or dependency cleanup. No test calls to the AI provider.
- Use the existing lint/typecheck/build scripts. Static copy and reversible CSS changes need visual checks, not tests that mirror their implementation.

## Review Focus

1. Opening a stage URL directly or scrolling backward must show the correct active stage; verify in Task 4.
2. Switching viewport size or reduced-motion preference while open must clean up the old mode and preserve readable content; verify in Task 4.
3. Delayed fonts or unavailable animation code must not hide content or break primary actions; verify in Tasks 1 and 4.
4. Bengali text, ampersands, spaces, and punctuation must survive the editable example/hero handoff; verify in Tasks 1 and 3.
5. Navigation away and back must not duplicate scroll listeners or animation instances; verify in Tasks 4 and 5.

---

## File Structure

Create `app/marketing.css` for scoped tokens and reusable primitives. Replace the composition in `app/page.tsx` using the following focused sections under `components/marketing/`:

- `marketing-brand.tsx`: marketing wordmark.
- `hero-section.tsx`: headline, existing form, illustrative preview.
- `capability-section.tsx`: six concrete capabilities.
- `process-content.ts`: typed five-stage story.
- `how-it-works.tsx`: semantic sequence and active-stage coordinator.
- `process-diagram.tsx`: diagram presentation and SVG connectors.
- `use-process-motion.ts`: client-only animation and cleanup.
- `business-examples.tsx`: editable example selection and advisor prefill.
- `notes-section.tsx`: illustrative notes explanation.
- `faq-section.tsx`: truthful product FAQs.

Modify `components/site-header.tsx` for marketing navigation and `components/hero-form.tsx` with an optional marketing appearance. Update metadata in `app/layout.tsx` only where needed. Modify dependencies during Task 4, preserving the user's existing package edits. Existing map/Magic Bento files stay in the repository and cease to be imported by the homepage.

## Execution Setup

- [ ] After this plan is reviewed, use the using-git-worktrees skill. The current checkout is on `main`, not an isolated worktree; obtain the user's worktree/in-place preference before changing branches or creating isolation, as that skill requires.
- [ ] Preserve the package and generated-type local edits. Dependencies already exist in `node_modules`; do not reinstall everything without a need.
- [ ] Run `npm run lint` and `npm run typecheck` for a baseline; identify any pre-existing failures before product work.
- [ ] Create a per-plan progress ledger under the execution skill's ignored workspace. Record the base commit, task states, decisions, and actual check results.
- [ ] Read both the parent spec and theme contract. Review shared interfaces before starting Task 1.

### Task 1: Establish the theme, header, and hero

**Files:** Create `app/marketing.css`, `components/marketing/marketing-brand.tsx`, `components/marketing/hero-section.tsx`; modify `app/page.tsx`, `components/site-header.tsx`, `components/hero-form.tsx`.

**Interfaces:**
- Produce `MarketingBrand(): React.JSX.Element` and `HeroSection(): React.JSX.Element`.
- Extend `HeroForm({ appearance = "default" }: { appearance?: "default" | "marketing" }): React.JSX.Element` without changing validation or routing.
- Marketing root: `<div className="marketing-page">`; theme primitives: `.mk-container`, `.mk-section`, `.mk-button`, `.mk-button-secondary`, `.mk-label`, `.mk-panel`.
- Header anchors: `/#capabilities`, `/#how-it-works`, `/#examples`, `/#faq`; primary action `/advisor`.

- [ ] Open the existing homepage and record the expected mismatch: dark cyan theme, no Paper Arcade hierarchy. Check the existing hero validation before edits to establish its behavior.
- [ ] Implement exact theme tokens, font roles, dimensions, geometry, focus styles, and motion timings from the theme contract in scoped CSS. Import it from the homepage; do not replace shared globals.
- [ ] Build the ink wordmark, new header, and hero. Use “BIG IDEA. WHAT’S NEXT?”, a concise Bangladesh-focused description, existing validated form, illustrative conversation, and process anchor.
- [ ] Apply the optional marketing form appearance. Keep the default appearance available for other consumers. Valid input must navigate to `/advisor?idea=${encodeURIComponent(value.trim())}`; fewer than four trimmed characters must show the existing inline error.
- [ ] Visually check at 1440×900 and 390×844: typography hierarchy, ink outlines, hard shadows, orange-label contrast, keyboard focus, mobile navigation, and readable fallback fonts. Disable the font request and confirm usable text/actions.
- [ ] Submit `ঢাকায় bakery & coffee?` and confirm the advisor draft contains exactly that text without an automatic API request.
- [ ] Run `npm run lint` and `npm run typecheck`; expected exit 0. Commit only Task 1 files with `feat: establish Paper Arcade marketing theme`.

### Task 2: Build the static explanatory homepage and process

**Files:** Create `capability-section.tsx`, `process-content.ts`, `how-it-works.tsx`, `process-diagram.tsx`, `notes-section.tsx`, `faq-section.tsx` under `components/marketing/`; modify `app/page.tsx`, `app/marketing.css`, `app/layout.tsx`.

**Interfaces:**
- Produce `CapabilitySection()`, `NotesSection()`, `FaqSection()`, and `HowItWorks()`, each returning `React.JSX.Element`.
- Export `type ProcessStage = { id: string; number: string; title: string; description: string; details: readonly string[] }`, and `PROCESS_STAGES: readonly ProcessStage[]` from `process-content.ts`.
- Stable stage IDs: `process-idea`, `process-context`, `process-analysis`, `process-plan`, `process-notes` in that order.
- Produce `ProcessDiagram({ activeStage }: { activeStage: number }): React.JSX.Element`, using zero-based indices 0–4; it renders decorative equivalent content with `aria-hidden="true"`.
- `HowItWorks` owns real headings, copy, stage anchors, and a visible ordered sequence; the diagram is never the only source of information.

- [ ] Inspect the old page's missing explanatory journey and stale “not sent to an AI” copy; record this as the expected pre-change failure.
- [ ] Build all six capability explanations from the parent spec, with concrete questions and useful outputs. Do not add fabricated metrics or live-data claims.
- [ ] Implement five semantic stage sections from the exact parent-spec story. Build the whole connected diagram as static HTML/SVG before motion; include the final follow-up loop, note, and advisor link.
- [ ] Add truthful notes and FAQs: provider submission, local note persistence, session-only chat, language support, and lack of live market tools.
- [ ] Compose the sections, closing action, and footer in `app/page.tsx`; update title/description to describe the actual advisor. Remove homepage imports of decorative WebGL and Magic Bento.
- [ ] With JavaScript disabled, verify all stages, sample label, capability explanations, FAQ disclosures, and direct advisor links remain available. Restore JavaScript and check keyboard order and assistive-technology landmarks.
- [ ] Run `npm run lint` and `npm run typecheck`; expected exit 0. Commit the task's files with `feat: explain BizGuide capabilities and planning journey`.

### Task 3: Add editable business examples

**Files:** Create `components/marketing/business-examples.tsx`; modify `app/page.tsx` and `app/marketing.css`.

**Interfaces:**
- Produce `BusinessExamples(): React.JSX.Element` with section ID `examples`.
- Internal example keys: `bakery`, `boutique`, `agro`; use native selection buttons with `aria-pressed` rather than claiming tab semantics.
- Each selection sets the labeled textarea to its example prompt. The advisor link derives from the current edited, trimmed text, not the original preset.

- [ ] Record the pre-change failure: users cannot select/edit three scenarios or navigate with the edited prompt.
- [ ] Add bakery, boutique, and agro supply presets with distinct planning questions and guidance topics. Limit the textarea to 500 characters to match the advisor's accepted initial draft length.
- [ ] Make selection keyboard accessible, show the selected state beyond color, and preserve intentional line breaks inside the input. Disable navigation with a clear helper when trimmed text has fewer than four characters.
- [ ] Select each example, edit it, and activate its link. Confirm exact round-trip text including `৳`, Bengali characters, `&`, `?`, and line breaks; confirm changing examples replaces the draft with that preset.
- [ ] Run `npm run lint` and `npm run typecheck`; expected exit 0. Commit with `feat: add editable business planning examples`.

### Task 4: Enhance the process with GSAP and Anime.js

**Files:** Create `components/marketing/use-process-motion.ts`; modify `how-it-works.tsx`, `process-diagram.tsx`, `app/marketing.css`, `package.json`, `package-lock.json`.

**Interfaces:**
- Produce `useProcessMotion(rootRef: React.RefObject<HTMLElement | null>, onStageChange: (stage: number) => void): void`.
- `HowItWorks` owns `activeStage` initialized to 0 and passes its stable state setter to the hook. `ProcessDiagram` consumes only `activeStage`.
- Hook selectors are scoped beneath `rootRef`: `[data-process-step]`, `[data-process-path]`, `[data-process-node]`, `[data-process-detail]`, `[data-process-note]`. GSAP targets path/node wrappers; Anime.js targets detail/note children.

- [ ] Before product changes, walk the static section at desktop size and record missing stage activation, connector progression, reverse navigation, and note arrival.
- [ ] Consult current primary GSAP and Anime.js documentation, inspect installed GSAP types, and install Anime.js v4 compatible with the documented API. Preserve unrelated package edits. Keep animation imports inside the client enhancement lifecycle and ignore async completion after cleanup.
- [ ] Implement native-scroll stage detection and scrubbed connectors at `min-width: 1024px` plus `min-height: 720px`, with reduced motion off. Use CSS sticky, five roughly 75vh explanation sections, and ordinary anchor navigation. No wheel handlers or continuous React state updates.
- [ ] Add distinct Anime.js detail targets for short arrivals, including the final note within 500ms. Scope and dispose both libraries' instances; handle development effect remounts, mode changes, and a delayed dynamic import.
- [ ] Make all other modes a full normal-flow vertical sequence. Reduced motion must remove automated motion immediately when toggled. Refresh geometry after fonts load and on layout changes, with cleanup for pending work.
- [ ] Validate desktop forward/reverse scroll through indices 0–4; verify labels, complete final diagram, and subsequent section access. Load each stage anchor directly, including `#process-notes`, and verify correct initial state.
- [ ] Resize 1440×900 → 390×844 → 1440×900 and then 1024×600. Toggle reduced motion while open. Verify no clipping, unreadable future content, stale state, or duplicate triggers.
- [ ] Navigate to the advisor and back three times. Check console errors and active event/animation cleanup; confirm sample notes never enter localStorage and the walkthrough makes no AI request.
- [ ] Block animation loading and verify all semantic stage content and actions remain usable. Run lint/typecheck; expected exit 0. Commit with `feat: animate the scroll-driven business walkthrough`.

### Task 5: Verify the integrated result and review

**Files:** All changed marketing files; execution progress ledger. No unrelated refactor.

**Interfaces:** Consume the completed page and all interfaces above; produce a verified local implementation with documented limits.

- [ ] Run `npm run lint`, `npm run typecheck`, and `npm run build`; expected exit 0 for each. Record real output, not predictions.
- [ ] Review at 1440×900, 1024×768, 390×844, and 320×568. Check hero line breaks, minimum hit targets, form errors, FAQ controls, no horizontal overflow, process/connector fit, anchor offsets, and footer reachability.
- [ ] Recheck reduced motion, short viewport fallback, JavaScript-disabled content, blocked fonts/animation, and navigation away/back. Verify the marketing CSS has not changed `/advisor` typography or dark styling.
- [ ] Verify hero and edited example links reach the correct advisor draft without submitting a provider request. Compare marketing claims to current API, prompt, chat, and notes behavior.
- [ ] Use the React best-practices skill to review component boundaries, hook cleanup, accessibility, and unnecessary client code. Apply only fixes within this task's scope, then rerun affected checks.
- [ ] Use the executing-plans skill's final review procedure. If its reviewer is dispatched, restrict that reviewer to reading the change and reporting issues; no publishing or merging is authorized.
- [ ] Inspect the final diff and preserve the user's pre-existing changes. Record any unresolved issue with evidence. Commit final fixes if any, using `fix: polish marketing layout and motion behavior`.
- [ ] Report the theme, homepage changes, actual verification results, and any limits. Keep the work local; no deployment, push, or merge without a separate instruction.

## Plan Self-Review

Coverage: theme and hero in Task 1; page architecture, capabilities, privacy/language corrections, static process, notes, and FAQ in Task 2; editable examples in Task 3; all motion ownership and lifecycle requirements in Task 4; integrated accessibility, responsive review, regression protection, and build checks in Task 5.

Shared interfaces agree: Task 2's stage IDs and zero-based diagram index are consumed unchanged by Task 4. Task 1's marketing primitives are extended by later tasks. Only Task 4 changes animation dependencies. Each Review Focus condition has an explicit behavioral check in the owning task.

No product implementation, dependency installation, or verification pass is claimed by this planning document.
