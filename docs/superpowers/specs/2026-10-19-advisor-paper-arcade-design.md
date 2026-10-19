# BizGuide AI — Advisor workspace in Paper Arcade

Date: 2026-10-19
Status: Design for review. Plan: `docs/superpowers/plans/2026-10-19-advisor-paper-arcade.md`.
Parents: `2026-10-19-homepage-theme.md` (palette, type, geometry, motion) and `2026-10-19-homepage-redesign-design.md`.

## Goal

Make `/advisor` look and feel like the redesigned homepage (paper, ink outlines, hard offset shadows, Space Grotesk and IBM Plex Mono). Chat behaviour, the `/api/advisor/chat` contract, the system prompt, and local notes storage stay exactly as they are.

This request supersedes two lines in the theme contract: "Avoid applying marketing typography to the advisor" and "advisor components remain outside the redesign". The theme document is user-owned, so the agency does not edit it. This spec records the change.

## What the advisor renders today

Code read at `fb9e636`:

- `app/advisor/page.tsx` renders `<Suspense>` with a dark loading fallback around `AdvisorExperience`, which uses `useSearchParams`.
- `components/advisor-experience.tsx` is a full-height app shell with a dark header, a scrolling transcript, and a composer pinned to the bottom. Notes appear as a sidebar at 1024px and wider, and as a right-hand drawer below that. The header has the old `Brand` logo, a "New plan" button that is hidden below 640px, a Notes button below 1024px, and an icon-only back link. A `.soft-grid` and a logo watermark decorate the transcript.
- `components/advisor-message.tsx` contains a hand-rolled line renderer for headings, bullets, numbered lines, and bold text. It shows a pin button on each assistant line longer than 8 characters. On desktop the pin buttons stay invisible until hover.
- `components/pinned-notes.tsx` provides quick add, a list, edit (button or double-click), copy, and remove. It renders twice (sidebar plus drawer), so `id="manual-note"` is duplicated.
- Styling is all Tailwind utility classes with hard-coded dark hex values. `app/globals.css` provides dark tokens, DM Sans/Manrope, a cyan `:focus-visible` ring, a global 180ms transition on `a, button, input, textarea`, and a global reduced-motion block.

## Decisions

### 1. Scoping: shared theme layer plus an advisor-scoped stylesheet

- **`app/paper-arcade.css` (new, imported once from `app/layout.tsx`).** It holds the theme tokens and generic primitives, moved verbatim out of `app/marketing.css`. The token and root block applies to `.marketing-page, .advisor-page`. Selection and focus-ring rules list both roots. Generic primitives (`.mk-label`, `.mk-chip`, `.mk-panel*`, `.mk-button`, `.mk-button-secondary`, `.mk-icon-button`, `.mk-field-shell`, `.mk-input`, `.mk-error`, `.mk-wordmark*`, `.mk-sr-only`, the typography classes, `.mk-container`, `.mk-section`) are defined only there.
  - **Why the root layout?** React 19/Next keeps stylesheets in the document after client-side navigation. If the shared rules were imported per page, they could end up in two route chunks. A second copy would then load *after* `marketing.css` and override homepage modifiers of equal specificity (for example `.mk-chip--tag`, or `.mk-cap--sage` on a `.mk-panel`) after a visit to the advisor. Importing once from the root layout gives a single copy that is always ordered first. Next's docs also recommend importing global styles at the root.
- **`app/marketing.css`** loses the moved blocks and nothing else. The homepage's computed styles must be identical before and after. Plan Task 1 proves this with a computed-style dump.
- **`app/advisor/advisor.css` (new, imported by `app/advisor/page.tsx`).** Every selector starts with `.advisor-page` or `:root:has(.advisor-page)`, and every class it defines uses the `adv-` prefix. It may stay loaded after navigating back to the homepage without matching anything there.
- **No global dark-to-light flip.** `app/globals.css` is not modified. A `:root:has(.advisor-page)` rule sets `color-scheme: light` and a paper background (with a matching `body` rule) only while the advisor is mounted. Inner scrollbars inherit `color-scheme: light` from `.advisor-page`.
- **Advisor markup uses only `adv-*` classes and the shared primitives.** It never uses homepage-only `mk-*` classes (`mk-header`, `mk-footer`, `mk-hero*`, and so on), because whether those exist depends on navigation history. Tailwind utilities are removed from the advisor files, so no layered/unlayered conflicts arise.
- **Rejected alternatives:**
  - Importing all of `marketing.css` on `/advisor`: about 1,900 lines, mostly homepage-only, and it couples the two pages.
  - Duplicating the tokens and primitives into `advisor.css`: around 200 duplicated lines that would drift.

### 2. Fonts

- A font definitions file, `app/paper-arcade-fonts.ts`, makes the three existing `next/font/google` calls with identical options and exports `paperArcadeFontVariables`.
- `app/page.tsx` and `app/advisor/page.tsx` both import it, so each font is hosted once. This follows Next's "font definitions file" guidance.
- The advisor applies the variables on its root wrapper.
- Josefin Slab is used once on the advisor, as the editorial accent in the empty-notes title.

### 3. Header, and no footer

- The advisor is a full-height app shell with no site footer. The disclaimer under the composer takes over the footer's verification-note role.
- Header layout: `MarketingBrand` (ink wordmark linking to the homepage). At 1024px and wider, a mono tag "Bangladesh business advisor" follows it. Then the actions:
  - **New plan**: `mk-button-secondary`, visible at **all** widths. Today it is hidden on mobile.
  - **Notes (n)**: below 1024px only. Opens the drawer.
  - **Back to home**: a `next/link` to the homepage. There are no hash links, and `SiteHeader`/`HashLink` are not reused.
- Below 768px the three actions become 44x44 icon buttons. Their labels stay in the accessibility tree through a visually hidden span. Below 400px the wordmark shrinks to 1.125rem so the header fits at 320px.

### 4. Visual language per component

| Part | Treatment |
| --- | --- |
| Shell | Paper background, 2px ink rules between header/transcript/composer/sidebar; no grid texture, watermark, glow, blur, or gradient. |
| Assistant message | Paper card, 2px ink border, 4px radius, 4x4 ink hard shadow, full column width; mono meta row with ink "AI" badge and "BizGuide" (plus "· Writing…" while text streams). |
| User message | Sage card, 2px ink border, no shadow, right-aligned, max `min(88%, 640px)`; mono meta "You". |
| Markdown | Headings uppercase Space Grotesk 700 16px; bullets and numbered lines get an 8x8 ink square marker; bold is 700; body 16px/1.65; `overflow-wrap: anywhere`. Parsing logic is unchanged (numbered lines still lose their numbers — known defect). |
| Pin per line | 44x44, always visible (the hover reveal is removed). Unpinned: transparent border with an ink outline icon, plus a border and yellow fill on hover. Pinned: yellow fill, ink border, filled icon (shape and fill, not just colour). |
| Thinking | Three 8x8 ink squares pulsing opacity plus visible "Thinking…" label; static under reduced motion. |
| Starters | `mk-button-secondary` cards in sentence case Space Grotesk, 2 columns at 640px and wider, min-height 56px. |
| Prefilled idea | Yellow dashed-border note above the composer: "From the homepage — Your idea is in the message box. Edit it, then press Send. Nothing is sent until you do." Shown only while the draft still equals the `?idea=` value and only the welcome message exists. |
| Composer | Paper shell with a 2px ink border and compact shadow, plus a focus-within ring (like `.mk-field-shell`). Textarea 16px. The footer holds a keyboard hint (hidden on coarse pointers below 768px) and an orange **Send** `mk-button` with a #10120E label. While a reply streams: the textarea is disabled with the placeholder "BizGuide is replying… use Stop reply to interrupt.", the hint reads "BizGuide is replying…", and a **Stop reply** secondary button is shown. Disabled Send: dashed border, no shadow, 60% opacity. |
| Errors | `role="alert"` block with a paper background, 2px ink border, 8px orange left border, triangle icon, and the error text verbatim, plus a **Retry** secondary button when there is something to retry. Covers 503 provider-not-configured, 400 validation, network failure, stop, and client validation. |
| Notes panel | Yellow board. Ink header strip with a 40x40 ink icon tile, "Pinned notes" heading, and mono count. Quick-note row: a 48px paper input and a 48x48 add icon button. Notes are paper cards with an ink border and compact shadow, `white-space: pre-wrap`, a mono source label, and 44px Copy/Edit/Remove buttons. Copy shows a visible "Copied" label for its existing 1.4s. Edit mode has text buttons **Cancel** and **Save**. |
| Drawer (below 1024px) | Ink 55% scrim with no blur. Panel `min(92vw, 380px)`, 2px ink left border, 240ms slide-in (none under reduced motion). `role="dialog"`, `aria-modal="true"`, `aria-label="Pinned notes"`. |
| Toast | Ink pill with paper mono text and a check icon, placed under the header (not over the composer), `role="status"` (existing). |
| Loading fallback | Paper screen with a mono "Loading the advisor workspace…" message and `role="status"`. |

### 5. Responsive behaviour

| Viewport | Layout |
| --- | --- |
| 1440x900 | Header 72px. Transcript column centred at max 820px. Notes sidebar 380px. |
| 1024x768 | Header 72px. Sidebar 340px. Chat column about 680px. |
| 390x844 | Header 60px with icon actions. Drawer for notes. Composer padding 12px. |
| 320x568 | Same as 390, with the wordmark at 1.125rem and 12px side padding. The transcript keeps at least 160px with an error and the prefill note shown. |

- **Viewport height.** The shell is exactly `100dvh`, falling back to `100vh`. The old `min-h-[650px]` is removed, so the body never scrolls (today it does on a 568px-tall screen).
- **Scrolling.** Only the transcript and the notes list scroll, both with `overscroll-behavior: contain`. The composer is the last grid row, so it is always visible without sticky positioning.
- **Overflow.** There is no horizontal overflow at any listed size, with web fonts or with fallback fonts.
- **Safe-area insets.** They use `env(safe-area-inset-*)` inside `max()` on the header top, the composer bottom, the drawer panel, and the side padding. `viewport-fit` stays at Next's default (the root layout owns it), so these resolve to 0 today and are future-proof.

### 6. Accessibility

- **Focus.**
  - Every control uses the shared ring: a 3px ink outline plus a 3px paper separation.
  - `advisor.css` never sets `box-shadow`, `outline`, `--mk-shadow`, or `transform` on elements that carry a shared control class. The only exceptions are `:disabled` states, which cannot take focus. This keeps the ring from being overridden.
  - The composer textarea and the transcript use inset outlines.
- **Screen readers.**
  - A visually hidden `<h1>` "BizGuide AI business advisor" starts the main region.
  - A visually hidden `role="status"` region announces "BizGuide is writing a reply." and then "BizGuide replied." These values are derived from existing state. Streaming text itself is not live, which avoids token-by-token chatter.
  - The streaming article gets `aria-busy`.
- **No state by colour alone.** Every state has a non-colour cue: text (Send, Stop reply, Thinking…, Writing…, Copied, error text with an icon), the filled icon and border for Pinned, or border style for disabled.
- **Contrast.** No text is ever orange. Orange surfaces carry `--mk-on-orange` (#10120E) labels at 4.58:1. Ink text sits on paper (12.67:1), sage (8.39:1), and yellow (9.84:1).
- **Target sizes.** Controls are at least 48px tall. Icon controls are at least 44x44.
- **Accessible names.** All existing accessible names are preserved: "Send message", "Stop response", "Back to homepage", "New plan", "Notes", "Pin this line" / "This line is pinned", "Add note", "Copy note", "Edit note", "Remove note", "Save note", "Cancel editing", "Close notes", "Close notes overlay", "Quick note", "Ask BizGuide AI", "Pinned business notes", "BizGuide AI message", "Your message". Visible text is always contained in the name. The only intended change: the Copy button reads "Copied" for 1.4s.
- **Reduced motion.** The global block in `globals.css` already neutralises transitions. The advisor also removes the thinking animation and the drawer slide. With open question 1 approved, transcript autoscroll uses `auto` instead of `smooth` when reduced motion is requested.

### 7. Behaviour-preservation contract

Presentation-only changes are allowed in `app/advisor/page.tsx`, `components/advisor-experience.tsx`, `components/advisor-message.tsx`, and `components/pinned-notes.tsx`:

- class names and markup structure;
- icons;
- ARIA/role/id/tabIndex attributes;
- static copy;
- render-only values derived from existing state.

**Pending human approval (plan open question 1):** a small set of UI-only additions that touch neither chat, API, nor storage:

- notes-drawer Escape handling, initial focus, and focus return;
- reduced-motion-aware autoscroll;
- `useId` to fix the duplicate `manual-note` id.

**Behaviour-bearing code stays byte-identical.** This covers every state hook, effect, `addPin`, `updatePin`, `removePin`, `requestAdvice` (including validation messages and limits), `submit`, `handleKeyDown`, `stop`, `resetChat`, `retry`, the localStorage key/format, the `?idea=` 500-character slice, the line parser, and the PinnedNotes handlers. The plan proves this three ways:

- a protected-lines/substrings script;
- a Playwright behaviour harness with every `/api/**` request intercepted, so no provider call is ever made, compared against a baseline captured before any edit;
- lint, typecheck, and build.

## Known advisor defects (recorded, not fixed by this restyle)

1. **Chat history cap.** The chat route rejects more than 30 messages (`app/api/advisor/chat/route.ts:9`), but the client sends the full history (`components/advisor-experience.tsx:87`). With the welcome message, the 15th follow-up fails with "Send between 1 and 30 valid conversation messages." until **New plan**. The server only forwards the last 24 anyway (`route.ts:52`).
2. **Notes cap.** The advisor loads only the first 60 saved notes (`advisor-experience.tsx:50`) and saves that truncated list back (`:58`), silently deleting the rest.
3. **Retry duplicates the message.** After a failure the user message stays in the transcript, and `retry()` appends it again, so the transcript and request contain duplicate consecutive user messages. This also accelerates defect 1.
4. **New plan while streaming.** It aborts the request, and the abort handler then shows "Response stopped…" on the fresh conversation.
5. **Copy errors are unhandled.** `navigator.clipboard.writeText` rejection (insecure context or denied permission) is not caught, so there is no feedback.
6. **Numbered lists lose their numbers.** `cleanLine` strips the number and the line renders as a bullet.
7. **Overlapping notices.** The `pinNotice`/`copiedId` timers are not cleared, so rapid actions cut a notice short.
8. **Provider error copy.** The 503 text "OpenRouter is not configured on the server." is developer-facing. It is shown verbatim, which this restyle keeps.

The plan's open questions ask whether 1 and 2 should be fixed as a separate follow-up task.
