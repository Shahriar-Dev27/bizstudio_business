# BizGuide AI homepage redesign — design specification

Date: 2026-10-19
Status: Proposed design, awaiting user review. Product implementation is not authorized.

## 1. Intent and success

Turn the homepage into an engaging explanation of what BizGuide AI helps a Bangladesh entrepreneur do, how the conversation works, and what useful outputs they can expect. The reference is a retro arcade interface with oversized lettering, tactile controls, flat color, and offset shadows. Adapt that visual character to a business planning product with a new palette and typography.

The central experience is a scroll-driven diagram. A visitor watches one business idea move through clarification, business analysis, a practical plan, and saved recommendations. The experience must remain understandable without animation.

User requirements:

- Explain the actual capabilities of the system more thoroughly than the current homepage.
- Use the supplied retro arcade reference as stylistic inspiration.
- Introduce a new color palette and typography appropriate to that style.
- Make “How it works” an interactive diagram that reveals the complete process while scrolling.
- Include motion using GSAP and Anime.js.
- Create the plan without implementing the redesign.

Planning assumptions, open to correction:

- Redesign the whole marketing homepage; make the animated walkthrough its centerpiece.
- Use the previously proposed cream, ink, burnt orange, sage, and butter yellow palette.
- Use Space Grotesk and IBM Plex Mono.
- Keep the existing advisor conversation and its behavior outside the visual redesign scope.
- Keep the existing raster logo as an asset; use an ink wordmark treatment in the homepage header rather than recoloring the image.

Success means a visitor can identify the audience, name several concrete capabilities, understand the five-stage process, distinguish the illustrative walkthrough from a live answer, and start an advisor conversation from the homepage.

## 2. Existing project evidence

- `app/page.tsx`: existing dark homepage, static three-step process, decorative map, Magic Bento capability cards, and FAQs.
- `app/globals.css`: shared dark design tokens and typography; changes here could unintentionally affect the advisor.
- `components/hero-form.tsx`: validates the idea and navigates to `/advisor?idea=<encoded idea>`.
- `components/site-header.tsx`: shared homepage navigation with mobile menu.
- `components/advisor-experience.tsx`: AI conversation, streamed responses, follow-up questions, and pinned notes.
- `components/advisor-message.tsx`: individual response lines can be pinned.
- `components/pinned-notes.tsx`: personal notes, editing, copying, and removal.
- `lib/advisor-prompt.ts`: Bangladesh business guidance, BDT context, clarifying questions, business analysis, lower-capital alternatives, prioritized actions, and Bangla/Banglish understanding.
- `app/api/advisor/chat/route.ts`: messages are sent to OpenRouter. There is no market research or browsing tool in this request path.
- `package.json`: Next.js, React, TypeScript, Tailwind CSS, Lucide, and GSAP are present. Anime.js is absent.

Current homepage claims that no AI receives the idea and that Bangla support is a future milestone are inconsistent with the implemented advisor. Rewrite these claims as part of the homepage content work.

Existing local changes in `next-env.d.ts` and `package-lock.json` predate this planning task. Do not overwrite or revert them.

## 3. Approaches considered

### Recommended: sticky process diagram with progressive context

Keep a diagram beside a changing explanation on desktop. Reveal the process in five stages and preserve completed stages as compact nodes. Finish with the complete connected diagram. This best meets the request to see the whole task while scrolling and keeps the product explanation readable.

### Alternative: full-screen cinematic scenes

Each stage fills the viewport and transitions to the next. This offers stronger spectacle, but visitors can lose the relationship between stages, and it needs more motion and layout work on smaller screens.

### Alternative: interactive stepper

Visitors click through five stages. This is compact and easy to navigate, but does not make scrolling the primary storytelling mechanism. Retain a small step navigator as an enhancement to the recommended approach.

## 4. Visual system

| Role | Value | Usage |
| --- | --- | --- |
| Paper | `#F4EBDD` | Main background and readable content surfaces |
| Ink | `#252820` | Body text, borders, connectors, hard shadows |
| Burnt orange | `#D94F30` | Primary controls, active nodes, emphatic accents |
| Sage | `#B9C7A5` | Capability panels and completed stages |
| Butter yellow | `#F2CE67` | Highlights, progress markers, notes |

- Use ink text on colored surfaces, including orange buttons. Check actual contrast during implementation; do not assume white text is readable on orange.
- Space Grotesk: headings at 700 weight and body text at 400/500 weight.
- IBM Plex Mono: navigation labels, step numbers, short metadata, and keyboard-style controls at 400/500 weight.
- Use a compatible system fallback stack and reserve layout space so content remains readable while fonts load or fail.
- Hero heading: `clamp(3rem, 7.5vw, 7.5rem)`, compact line height, maximum three lines on a narrow phone.
- Body copy: at least 16px with approximately 1.6 line height. Mono is for short labels, not long explanatory paragraphs.
- Use 2px ink borders, square or subtly rounded corners up to 8px, and hard shadows offset by 5–8px.
- Controls press toward their shadow on activation. Use a visible ink focus outline with a paper separation ring.
- Use flat line illustrations and Lucide icons with a consistent stroke. Avoid the current glow-heavy cards and decorative particle effects in the redesigned homepage.
- The reference supplies visual character, not a game mechanic: navigation and reading require no keyboard game controls or entry screen.

## 5. Homepage information architecture

1. **Header:** ink wordmark, anchors for Capabilities, How it works, Examples, and FAQ, plus “Start planning”. Preserve an accessible mobile menu.
2. **Hero:** “BIG IDEA. WHAT’S NEXT?” with a short description of the Bangladesh business planning partner. Include the working idea form and an illustrative mini conversation. Primary action: “Explore my idea”. Secondary link: “See how it works”.
3. **Capability overview:** six concrete capabilities, each with a user question and expected help: customer and demand; location and competition; startup budget and working capital; operations and suppliers; timing and risks; testing and launch actions. Describe guidance and validation methods rather than implying access to live data.
4. **How it works:** the five-stage interactive diagram defined below, with a short lead-in and explicit sample label.
5. **Business examples:** switch between neighborhood bakery, online boutique, and agro supply store. Each example shows an editable question, the issues the advisor can explore, and a link that prefills the selected question in the advisor. These examples remain local illustrative content and do not call the AI.
6. **Keep the useful parts:** demonstrate pinning a recommendation and adding a personal note. Explain that pinned notes are saved in this browser; do not imply account or cross-device storage.
7. **FAQ:** what the advisor does; whether it has live market data; English/Bangla/Banglish support; what is sent to the AI provider; local note storage and session-only chat behavior; how to begin.
8. **Closing action and footer:** “Your business starts with a question.” Link to `/advisor`, retain product identity, and provide a concise statement that users should verify important financial, legal, and market details.

Keep the above sections part of one homepage redesign. Do not add accounts, pricing, a database, a new report engine, or a new AI workflow.

## 6. How it works: story and exact states

Section heading: **“FROM ‘WHAT IF’ TO ‘WHAT NEXT’.”**

Persistent label: **“Illustrative example — not a live AI response.”**

Example input: **“I want to open a bakery in Dhaka with ৳2 lakh.”**

The diagram explains the advisory journey; it does not claim that the backend runs five separate automated agents or research tools.

| Stage | Visible content | Diagram behavior | What remains visible |
| --- | --- | --- | --- |
| 01 — Share your idea | Example input plus a brief invitation to describe an idea in everyday language | Input block arrives; first connector draws toward the context node | Example input and stage number |
| 02 — Add your context | Three sample questions: “Which neighborhood?”, “Who will buy?”, “What experience do you have?” Context chips retain “Dhaka” and “৳2 lakh” | Question cards appear around the context node; connector reaches the analysis hub | Input, context summary, active questions |
| 03 — Explore the business | Six branches: Customers, Location, Budget, Operations, Timing, Risks. Supporting copy explains demand tests, cost assumptions, suppliers, seasonality, and verification | Branch connectors draw, then labels activate in a stagger | Input, compact context node, all six branches |
| 04 — Choose a practical next move | Sample plan: test a preorder bakery pilot; obtain current supplier quotes; interview potential customers; estimate costs using verified inputs. Show explicit “Assumption” and “Verify locally” labels | Analysis branches converge into a plan card; the plan replaces the large explanation area without erasing the diagram | Completed analysis, plan summary, assumption labels |
| 05 — Refine and keep what matters | Follow-up: “What if I start from home?” Pinned recommendation: “Test demand with preorders before committing to a shop lease.” | Follow-up connects back to the plan; the sample recommendation moves into a notes card once on entry | Entire completed diagram, follow-up loop, pinned note, final action |

At the final stage, show **“Your idea → Your context → Business lenses → Practical next steps → Refine + save”** as the full connected process and provide **“Start with your own idea ↗”**.

The demonstration is a fixed explanatory sequence. It must not require text submission, simulated waiting, external APIs, or actually saving sample notes.

## 7. Scroll and interaction behavior

### Desktop and sufficiently tall viewport

- Use the sticky diagram layout only at viewport widths of at least 1024px and heights of at least 720px when reduced motion is off.
- Use native document scrolling and CSS sticky positioning. Do not intercept the wheel, force scroll snapping, or lock the page.
- Layout: roughly 40% explanation and 60% diagram; keep the diagram below the header and within the available viewport height.
- Use five real stage sections in the document, approximately 75vh each with enough minimum height for their text.
- Scroll position determines the active stage. Scrubbing controls connector progress and large diagram transitions; the active stage label changes only when a stage boundary is crossed.
- Completed stages use sage, the active stage uses orange, and future stages retain paper surfaces and ink outlines. Numbers, labels, and completion marks also convey state.
- A visible 01–05 step navigator links to the real stage anchors. Clicking a number scrolls to that stage without moving keyboard focus into the illustration.
- Reverse scrolling restores the appropriate earlier state. Direct anchor navigation and an initial load midway through the section produce the correct state immediately.
- Keep key copy visible in the initial HTML. Decorative animation must not conceal the explanatory content if JavaScript fails.

### Mobile, short viewports, and reduced motion

- Below 1024px width or 720px height, use a vertical connected sequence in normal flow. Do not pin a full diagram on a small screen.
- At 320px width, all text and controls fit without horizontal page scrolling.
- Mobile allows short entry reveals but keeps content readable before and after each reveal.
- With `prefers-reduced-motion: reduce`, show the full static vertical process with ordinary anchors. No scrubbing, automatic movement, typing effects, or note travel.
- Apply preference changes while the page is open, not only on the first load.
- Ensure the user can continue scrolling into the following section without a dead zone.

## 8. Animation responsibilities and lifecycle

**GSAP owns:** scroll stage tracking, connector drawing, diagram layout transitions, stage emphasis, and progress rail updates.

**Anime.js owns:** short icon and card-detail animations on distinct child elements, plus the stage-five illustrative note arrival. It does not own scroll position or stage state.

- Never let the two libraries animate the same DOM element or CSS property owner. Use separate wrappers for large transitions and decorative child motion.
- Keep a single authoritative active-stage value. Do not update React state for every scroll pixel.
- Decorative entry motion: approximately 180–450ms. Initial note arrival: no more than 600ms. Avoid permanent bouncing or autoplay loops.
- All motion is scoped to the walkthrough root. Clean up scroll listeners, observers, GSAP timelines/triggers, and Anime.js animations on unmount and when switching layout modes.
- React development remounts must not duplicate animations or event handlers.
- Resizing, font loading, and mobile orientation changes must recompute geometry without losing access to content.
- Prefer transforms and opacity for moving elements. Draw connectors using SVG strokes; SVGs are UI-native diagrams, not generated image assets.
- Load animation code only for the client walkthrough. Keep the homepage shell and long-form copy server rendered.

## 9. Proposed implementation boundaries

This is a component map for the later implementation plan, not product code or permission to begin implementation.

| File | Responsibility |
| --- | --- |
| `app/page.tsx` | Compose the redesigned homepage from focused marketing sections |
| `app/marketing.css` | Scoped palette, fonts, layout, borders, shadows, and responsive styles |
| `app/layout.tsx` | Update homepage-relevant metadata; preserve shared advisor styling |
| `components/site-header.tsx` | Updated anchors and accessible responsive navigation |
| `components/hero-form.tsx` | Optional marketing appearance variant; preserve validation and navigation |
| `components/marketing/marketing-brand.tsx` | Homepage ink wordmark without changing the shared advisor brand |
| `components/marketing/hero-section.tsx` | Headline, idea entry, and illustrative conversation |
| `components/marketing/capability-section.tsx` | Six capability explanations grounded in current advisor behavior |
| `components/marketing/how-it-works.tsx` | Walkthrough container, semantic stages, anchors, and active stage coordination |
| `components/marketing/process-diagram.tsx` | Diagram nodes, SVG connectors, and stage presentation |
| `components/marketing/use-process-motion.ts` | GSAP/Anime.js ownership, media queries, geometry, and cleanup |
| `components/marketing/process-content.ts` | Typed sample story, stage IDs, labels, and exact example copy |
| `components/marketing/business-examples.tsx` | Accessible example selector and advisor prefill links |
| `components/marketing/notes-section.tsx` | Illustrative pinning explanation and truthful local storage copy |
| `components/marketing/faq-section.tsx` | Accessible FAQ and current product expectations |
| `package.json` / `package-lock.json` | Add Anime.js during implementation, preserving prior local lockfile changes |

Leave obsolete map and Magic Bento files in place unless the implementation discovers a concrete reason to remove them. Stop importing them on the homepage; do not turn this task into dependency cleanup.

Scope typography and light color-scheme styling under the marketing root. Do not globally replace dark tokens or the advisor's fonts. The walkthrough only links to the existing advisor; it does not change the API, system prompt, persistence, or response renderer.

## 10. Truthful capability and privacy copy

- Describe current AI conversation as available when the server provider is configured; do not make an unverified claim about deployment readiness or response reliability.
- Describe budget help as planning frameworks and illustrative estimates, not verified prices or financial forecasts.
- Describe market help as identifying questions, assumptions, and validation methods, not live competitor discovery or measured demand.
- State that submitted advisor messages go to the configured AI provider. Do not claim ideas remain entirely on-device.
- State that pinned notes are saved in this browser. The current code does not persist the conversation across page reloads.
- Explain English, Bangla, and Banglish as conversation support; do not claim the entire interface is localized.
- Avoid invented user counts, testimonials, accuracy scores, guaranteed outcomes, market metrics, or research citations.

## 11. Acceptance and verification

The later implementation plan must map these criteria to concrete checks:

- Homepage renders with the specified palette and two-font hierarchy, without changing the advisor's appearance.
- Hero form still rejects inputs shorter than four characters and forwards a valid, URL-encoded idea to the advisor draft without auto-submitting it.
- Each example selector updates its visible question and advisor link; arrow-key navigation works if implemented as tabs.
- All five stages are understandable as readable HTML without animation. The sample label remains visible.
- Desktop scroll activates stages 01 through 05 in order; reverse scroll, stage anchor navigation, and initial loading at a stage anchor work.
- At the final stage, the full process and follow-up loop remain visible, and the next homepage section is reachable.
- At mobile widths 320px and 390px, short desktop height 600px, and reduced motion, the normal-flow sequence stays readable with no horizontal overflow.
- Resize between mobile and desktop, change reduced-motion preference, and navigate away/back without duplicated event handlers, stale diagram state, or console errors.
- Keyboard focus, stage links, form labels, mobile navigation, example selection, and FAQs work without hover.
- Decorative diagram elements are hidden from assistive technology; the semantic stage descriptions provide the equivalent story. Scroll progress is not announced continuously.
- Font or animation loading failure leaves all explanations and primary actions usable.
- Production build, lint, and typecheck pass using the existing npm scripts. No dedicated tests that merely restate static marketing copy are required.
- Visually review at 1440×900, 1024×768, 390×844, and 320×568; check sticky clipping, connector overlap, contrast, text wrapping, and focus visibility.
- Do not send test messages to the AI just to validate this marketing redesign. Verify the advisor handoff and preserve the existing API behavior.

## 12. Review and next stage

Self-review completed for scope, contradictory claims, accessibility, animation ownership, fallback behavior, and component boundaries. No product files or dependencies are changed by this specification.

Under the Superpowers architectural workflow, the next stage is user review of this written design. After approval, create a separate implementation plan at `docs/superpowers/plans/2026-10-19-homepage-redesign.md` with exact interfaces, task checklists, verification commands, and review points. Do not implement or install dependencies as part of that planning step.
