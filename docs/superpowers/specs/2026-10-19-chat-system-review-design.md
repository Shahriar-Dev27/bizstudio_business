# Chat system review and proposed design

Date: 19 October 2026 (Asia/Dhaka). Target confirmed by the user: a public MVP for entrepreneurs in Bangladesh.

Status: approved for implementation by the user on 19 October 2026, with the amendments below. The findings describe the pre-implementation baseline.

## Approved amendments — 19 October 2026

- Roadmap requests produce a clear step-by-step business workflow with dependencies, actions, deliverables and completion criteria. Render a validated structured roadmap as an accessible diagram and ordered text; never execute model-generated HTML or diagram scripts.
- Default presentation buffers generated text while showing honest **AI is thinking** / **AI is typing** indicators, then reveals the completed answer. No fake percent or artificial delay. Stop/failure still retains and labels any partial text. The underlying connection continues streaming for cancellation and progress detection.
- Replace per-line pin buttons with a small action for text deliberately selected within one assistant answer. Also allow explicitly chosen roadmap steps to be pinned, with conversation/message provenance. Do not accidentally pin an entire speech.
- Replies should be precise and contextual, with short direct answers, specific actions and explicit unknowns. A requested roadmap may be longer than an ordinary answer.
- Add adaptive NVIDIA reasoning: quick mode for simple requests, deeper thinking for business analysis and roadmap requests, plus an explicit user choice. Keep private reasoning private. Use bounded reasoning/output budgets and record actual latency rather than promising that extra thinking is faster.
- Execute all local implementation tasks including device saves, English/Bangla UI and the plan workspace. Cloud accounts, research, documents, voice and payments remain separately designed future projects; no deployment is implied.

These user amendments override earlier defaults such as thinking always disabled, text displayed token by token, per-paragraph pin controls and postponing all roadmap/workspace features until after beta.

## Perspective

BizGuide has a useful product foundation: an approachable Bangladesh business-planning workspace, practical prompts, streaming answers, and a place to save useful recommendations. Its strongest differentiator is helping someone decide what to test before spending money.

It is currently a working prototype with gaps in reliability and advice quality. A public MVP must preserve a person's work, handle slow or failed generation clearly, remember the important business context, and distinguish planning suggestions from verified facts. More visual polish or a larger collection of AI features would not resolve those gaps.

Recommended product promise: **Explain your idea, understand the assumptions and risks, and leave with a small, measurable next step.**

## Scope and evidence

Reviewed: chat API, request validation, NVIDIA settings, streaming parser, conversation state, composer, rendering, notes, onboarding handoff, public claims, persistence, accessibility hooks, operational controls, and existing test evidence.

Evidence labels:

- **Live:** real local application/provider tests from this conversation. These are individual observations, not latency benchmarks or availability guarantees.
- **Harness:** isolated execution of the existing production handlers extracted using the TypeScript AST, with controlled network responses and state setters. This reproduces handler behavior without a full React/browser lifecycle.
- **Code:** a finding from the current source; not independently reproduced in a deployed environment.
- **Historical:** existing repository evidence from the earlier visual redesign; not rerun as part of this review.
- **Proposal:** a product recommendation, not an existing defect.

Observed results:

| Check | Result | Evidence |
| --- | --- | --- |
| NVIDIA model and key | Correct model returned a real answer | Live: model `nvidia/nemotron-3-ultra-550b-a55b`, HTTP 200 |
| Short follow-up with history | Retained city and BDT 50,000 budget | Live: first text 1,832 ms; completion 5,447 ms; terminal `stop` and `[DONE]` |
| Bangla output/UTF-8 | One-word Bangla greeting decoded correctly | Live: first text 869 ms; completion 901 ms; not a broad Bangla/Banglish evaluation |
| Realistic planning answer | Started, then failed; partial reply disappeared | Live browser: seven-day snack-business planning request ended in `network error`; the fixed 90-second deadline is a likely cause, not a fully instrumented attribution |
| Invalid inputs | Malformed JSON, blank/empty messages, system role and oversized messages rejected | Live: six invalid-input cases returned HTTP 400, including a 31-message payload |
| Provider faults | Missing key, 401, 429, 500, network failure and timeout handled before streaming | Isolated route tests: expected 503/401/429/500/502/504; raw HTML error hidden |
| Secret exposure | NVIDIA key absent from scanned browser assets | Live filesystem inspection: 162 generated client asset files; this is not a full security audit |
| Build-time checks | Type checking and linting pass | Fresh `npm.cmd run typecheck` and `npm.cmd run lint`; no fresh production build this review |
| Responsive shell | Earlier records show desktop/mobile layout and drawer focus checks | Historical `.agency/advisor-paper-arcade/report.md`; provider calls were intercepted in those tests |

One attempted Bangla-input test passed through a PowerShell-to-Node text pipe whose non-ASCII encoding was not controlled; its failed request is excluded from language-quality conclusions. The successful output test used an ASCII prompt requesting a Bangla greeting. A proper multilingual evaluation is still needed.

## What is good and should be preserved

1. **Clear local purpose.** The advisor prompt covers Bangladesh locations, BDT/lakh/crore, seasonality, small pilots, and local verification. It aims for useful decisions rather than guaranteed success. See `lib/advisor-prompt.ts`.
2. **Useful first interaction.** Welcome text, starter prompts, and homepage draft handoff reduce the effort required to begin. Handoff does not automatically submit the idea.
3. **Good separation of secrets.** The browser calls the app's route; NVIDIA authentication stays on the server. The client cannot directly choose a provider URL or supply a system-role message.
4. **Streaming already works.** The basic response format matches NVIDIA's OpenAI-compatible content deltas. UTF-8 decoding and fragmented-event buffering exist.
5. **Practical saved notes.** Pin, add, edit, copy, and remove support acting on advice. Notes are local and do not require registration.
6. **Existing visual identity.** The Paper Arcade shell is distinctive and readable. Responsive layout, focus styles, reduced-motion handling, accessible control labels and a notes drawer already have useful foundations.
7. **Honest capability messaging in several places.** The FAQ says there is no live market lookup and chat is session-only. Preserve that honesty while correcting outdated provider copy.
8. **Small implementation surface.** One provider route and a small number of components can be improved incrementally. A full rewrite is unnecessary.

## Findings and priorities

P0 = public-MVP release blocker. P1 = needed for a useful public MVP. P2 = subsequent product improvement. P0 does not imply that exploitation or loss has already occurred.

| ID | Priority / evidence | Problem and consequence | Source / proposed correction |
| --- | --- | --- | --- |
| F01 | P0 / Live + Code | A realistic longer answer failed after starting. The single 90-second timeout covers the stream; a late stream failure cannot be turned into JSON by the already-returned route. | `app/api/advisor/chat/route.ts:54`, `:68`, `:77`. Add measured first-output, idle and total deadlines; structured stream failures; verify hosting duration. Increasing the deadline alone is insufficient. |
| F02 | P0 / Live + Harness | Stop or failure removes useful generated text. The failed turn has no durable status. | `components/advisor-experience.tsx:141`. Keep partial output and label interrupted/failed/truncated turns. |
| F03 | P0 / Live + Code | Client sends all history; server rejects over 30 messages before taking the last 24. A normal chat hits the cap after about 15 exchanges. | `components/advisor-experience.tsx:86`, route `:9`, `:51`. Shared payload limits and bounded history selection before transmission. |
| F04 | P0 / Harness | Retry appends the same user message again. Repeated retries distort context and inflate history. | `components/advisor-experience.tsx:84`, `:152`. Retry the existing turn with a new attempt ID. |
| F05 | P0 / Harness | New Plan during a request clears the chat, then the previous request's catch sets an error in the new chat. Shared mutable refs also deserve race protection. | `components/advisor-experience.tsx:37`, `:40`, `:145`, `:151`. Abort plus conversation-generation and attempt guards on every callback. |
| F06 | P0 / Harness + Code | EOF without a terminal marker is treated as success; `finish_reason: length` is ignored. Malformed events are silently discarded. | `components/advisor-experience.tsx:112`, `:115`, `:139`. Parse terminal reasons and distinguish completion, truncation, interruption and protocol failure. |
| F07 | P0 / Code | Public API has no application-level admission limits, shared concurrency cap, total-body cap, or usage budget. It can spend the server's provider allowance. | Entire chat route. Add deployment-appropriate shared limits and global budget controls before public access; browser controls alone do not protect it. |
| F08 | P0 / Code + Live sample | Prompt asks for caution, but there is no evidence layer or evaluation suite. A sampled response asserted a licence exemption for a test kitchen without a supplied verified source. | `lib/advisor-prompt.ts`, prior browser output. Tighten response policy, concise answer modes and multilingual evaluations. Do not equate a disclaimer with reliable advice. |
| F09 | P1 / Live + Code | Markdown tables render as pipe-delimited lines, ordered steps lose numbering, and links are not rendered as useful links. | `components/advisor-message.tsx:7`, `:18`. Use maintained Markdown/GFM rendering, safe URL handling, semantic lists and mobile table overflow. |
| F10 | P1 / Code | Refresh/navigation loses the conversation and draft; New Plan clears progress immediately. | `components/advisor-experience.tsx:28`, `:29`, `:151`. Session recovery, draft autosave, undoable reset; clear local-device persistence controls. |
| F11 | P1 / Code | Fixed message window can forget the original budget/location. No explicit business brief or correction flow exists. | route `:51`, client `:86`. Editable user-confirmed brief retained outside the recent-message window; derived suggestions never silently become confirmed facts. |
| F12 | P1 / Harness | Enter submits during composition. | `components/advisor-experience.tsx:149`. Respect IME composition before Enter submission; validate on a real Bangla keyboard. |
| F13 | P1 / Code | Every token update scrolls to the bottom, even if the reader scrolls upward. Full transcript parsing/rendering also runs on every delta. | `components/advisor-experience.tsx:60`, `:124`. Follow only near the bottom, offer Jump to latest, coalesce updates and memoize settled messages. |
| F14 | P1 / Code | Notes writes are unguarded; restored notes validate only text; additions have no 60-note limit although restore silently slices to 60. Clipboard failures have no feedback. | client `:48`, `:57`, `:70`; `components/pinned-notes.tsx:14`. Validated storage adapter, visible limits, recoverable errors, migration and copy fallback. |
| F15 | P1 / Code | FAQ incorrectly says OpenRouter. Homepage draft appears in the URL, and thus browser history and potentially access logs. | `components/marketing/faq-section.tsx:44`, `:47`; `components/hero-form.tsx:24`. Correct NVIDIA disclosure; use a tab-local draft handoff and a clean URL. Avoid claims about NVIDIA retention without checking applicable terms. |
| F16 | P1 / Code | No request correlation, first-token/completion metrics, terminal status logging, or user-visible request reference. | Chat route and client. Add metadata-only observability; exclude prompts, notes, API keys and raw provider bodies from default logs. |
| F17 | P0 gate / Code | There is no maintained chat regression test command. Existing visual tests used mocked provider responses and did not prove real streaming reliability. | `package.json`, historical redesign report. Add focused regressions plus an explicit, limited live smoke/evaluation workflow. |
| F18 | P2 / Code | UI is English-only even when answers are Bangla. Document language is always English; multi-device persistence and a structured usable business plan are absent. | `app/layout.tsx:17`, `types/advisor.ts`, unreferenced `components/analysis-report.tsx`. Localize core chat controls and add a real plan workspace later. Existing report component is demo content, not a connected report feature. |

Additional checks to schedule, not claims of reproduced defects: screen-reader operation, keyboard/screen size transitions with an open notes drawer, actual Android/iOS virtual keyboards, offline-to-online recovery, multi-tab persistence conflicts, and deployed proxy buffering/cancellation.

## Product direction and alternatives

| Approach | Benefit | Cost / limitation | Decision |
| --- | --- | --- | --- |
| Incrementally stabilize this app | Preserves working UI and NVIDIA setup; directly addresses reproduced problems | Requires ownership of a small stream adapter and state machine | Recommended for MVP |
| Adopt a full AI SDK/chat framework now | Could standardize transport and hooks | Migration changes both client and server; does not supply advice quality, quotas or recovery policy automatically | Reconsider if multiple providers/tools become necessary |
| Build accounts, research agents and cloud plans immediately | Broader product capability | Adds infrastructure and sensitive-data management before the core interaction is dependable | Later, separate designs |

## Target experience

1. Describe an idea in English, Bangla or Banglish; optionally enter location, budget, stage and experience in a small editable business brief.
2. Get a short useful answer first: one to three clarifying questions when needed, otherwise assumptions, a practical recommendation and next actions. Detailed analysis is a deliberate follow-up.
3. See receiving/writing/interrupted/completed states. Stop preserves the answer. Retry reuses the question. Continue is available when output was cut short; it is a new generation, not guaranteed stream resumption.
4. Read earlier messages without being pulled to the bottom. Tables, lists and links remain readable on a phone.
5. Reload within the tab without losing the chat or draft. Explicitly save on this device to retain a plan beyond that session. New Plan creates a new workspace and offers undo.
6. Pin insights with business/conversation provenance. Export the brief, selected notes and next actions as text/Markdown before adding elaborate document exports.
7. Always understand which items are user-provided facts, assumptions, illustrative estimates or checks to perform. The app claims no current market knowledge without a genuine evidence source.

## Proposed architecture and constraints

Keep Next.js, React, TypeScript, NVIDIA and the existing visual system. Split the large chat component by responsibility during reliability work, without redesigning the homepage.

- `types/chat.ts`: versioned wire request/events, message states, business brief and public error codes.
- `lib/chat/limits.ts` and `history.ts`: shared request budgets and complete-turn history selection.
- `lib/chat/sse.ts`: provider-neutral incremental SSE framing. SSE multi-line data uses newline joining, not string concatenation.
- `lib/chat/provider.ts`: NVIDIA request and upstream-to-app event mapping, cancellation, deadlines and finish reasons. Server-only module.
- `lib/chat/admission.ts`: shared admission-control contract with an atomic store supplied by the deployment environment; no process-local public-production limiter.
- `lib/chat/telemetry.ts`: metadata-only timings and terminal outcomes.
- `lib/chat/storage.ts`: schema-versioned session recovery and explicitly opted-in durable device saves.
- `hooks/use-advisor-chat.ts`: turn/attempt reducer, cancellation and request-generation guards.
- `components/advisor-experience.tsx`: workspace composition, not transport parsing.
- `components/chat/*`: composer, transcript, status, brief editor and message actions; reuse existing notes UI.

Initial explicit limits for implementation/testing:

| Setting | Proposed value / behavior |
| --- | --- |
| Model | `nvidia/nemotron-3-ultra-550b-a55b`; server environment override only |
| Thinking | Disabled by default; expose no reasoning trace to users |
| User message | 2–4,000 characters; Enter during composition does not send |
| Prior assistant message | Up to 12,000 characters; longer generated content requires a visible truncation/recovery policy |
| Wire history | At most 24 messages, including current question; omit UI welcome and failed attempts; select complete recent pairs |
| Request body | 128 KiB UTF-8, enforced while reading even without Content-Length |
| Historical text | At most 60,000 characters and actual encoded-body budget; remove oldest pairs until both fit |
| Business brief | At most 2,048 characters of validated fields; sent as labelled user context, not interpolated into privileged system instructions |
| Answer size | Default concise target at most 250 words / 900 output tokens; detail mode 1,800 output tokens initially; retain actual finish reason |
| Initial deadline settings | First content 45 s, idle 45 s, total 180 s, all configurable and subject to verified host limits; heartbeat does not reset model-content idle timer |
| Client recovery deadline | Server total plus 10 s; failure preserves partial output |
| Retry | Explicit user action; no automatic replay after content has appeared; never append another copy of the original question |
| Public rate policy | Initial tunable policy: 10 attempts/minute and 100/day per anonymous session, 30/minute/IP, one active generation/session, 10 active globally; include global daily generated-token cap of 100,000 for the limited beta |
| Admission store | Atomic shared store; session + IP controls together, trusted deployment proxy configuration, per-instance memory only for local development; unavailable production store returns 503 before provider call |
| Notes | 60/device, 500 characters/note; new additions cannot silently exceed the restore limit |
| Saved device plans | Opt-in, at most 10 plans and 100 displayed messages/plan initially; warn and offer export/archive before a limit is reached |

The quota numbers are starting product settings, not NVIDIA limits or measured capacity. The global generation quota uses worst-case token reservation on admission and settlement on completion; keep the reservation after failures where actual usage is unknown. Use a daily UTC accounting window and display the reset time in the user's locale. Never show a monetary cost inferred from trial tokens. Revisit after measuring real demand and the applicable provider allowance.

No hosting provider or shared rate-limit store has been selected in this repository. Record that deployment decision before the public-admission task is implemented; public release remains blocked until an atomic adapter and real hosting smoke tests pass. If the host cannot support the initial total timeout, revise the answer budget/deadline policy rather than silently exceeding the host maximum. Do not deploy merely by changing a timeout constant.

### Stream and state behavior

Use one app-owned protocol over POST/fetch SSE, not browser EventSource automatic reconnection. Events: `start`, `delta`, `finish`, `error`; all include request/attempt correlation. `finish` carries `stop` or `length`; an EOF without a terminal event is interrupted. A pre-header failure uses JSON with stable error code; post-header failure uses an error event where the connection is writable. Socket loss remains an explicit client interruption.

Message statuses: `pending`, `streaming`, `complete`, `interrupted`, `failed`, `truncated`. Content is retained for every non-empty terminal state. Retrying a partial answer preserves the prior attempt in an accessible attempt history instead of overwriting the only copy. Conversation generation IDs and attempt IDs prevent old callbacks from mutating a new chat or a newer attempt. Abort propagates upstream and releases concurrency reservations exactly once. Retry targets the same turn; Continue creates a linked follow-up generation with partial content labelled as such. Failed/stopped partial messages do not enter normal historical context as completed answers.

### Advice quality and trust

Keep the prompt's local strengths; replace the default eight-section response requirement with a concise, context-dependent format. Ask missing decision-changing questions first, avoid unsupported legal exemptions or live price claims, and distinguish user-confirmed facts from assumptions. A business brief is editable context, not authoritative truth.

Before public release, evaluate 32 fixed cases: 8 English, 8 Bangla, 8 Banglish and 8 adverse/edge cases. Include missing context, budget changes, a different district, requests for current fees, overconfident profitability, harmful debt assumptions, prompt injection and a request to invent sources. Critical gate: zero invented citations, unsupported current legal assertions, or guaranteed returns in the evaluated outputs. Overall usefulness must pass at least 28/32 against a written human rubric; a failure triggers prompt/design changes and rerun of the affected cases. Passing the set does not establish universal correctness.

Live retrieval is a later feature. A proper research mode needs source URLs, retrieval dates, citations tied to actual retrieved content, failure states, content-injection handling, and independent retrieval/security tests. Prompting the model to invent citations is not a substitute.

## Delivery phases and release gates

| Phase | Outcome | Must pass before moving on |
| --- | --- | --- |
| A: Reliable conversation | Stable streaming, partial recovery, no duplicate retry, bounded history, request isolation | Regressions for F01–F06; simulated slow/truncated streams; 40-turn UI history selection |
| B: Useful everyday chat | Readable answers, IME-safe composer, respectful scrolling, session recovery, robust notes, editable brief | Reload/Stop/Retry/New Plan tests; mobile keyboard and storage-failure checks |
| C: Public beta readiness | Better answer policy, accurate disclosure, shared quotas, budget controls, logs and release checks | F07/F08/F15/F16/F17; host/store decision; multilingual rubric; deployed slow-stream and cancel tests |
| D: Product depth | Optional device plan library, exports, Bangla UI, plan workspace | User tests showing people can resume a plan and identify their next action |
| E: Separate later projects | Accounts/sync, cited research, documents/voice, billing and richer calculations | Separate designs after beta evidence justifies each capability |

Public beta includes A, B and C. D is a subsequent product increment, not a reason to postpone reliability. Acceptance targets: no lost non-empty partial reply in deterministic regressions; no duplicate turn after Retry; no 30-message cliff; no provider request after denied admission; all chosen-host stream/cancellation checks pass. Measure first-content p50/p95 and completion/failure rates over a beta cohort before making speed claims.

## Later feature backlog

- Device-only saved plan library with rename/archive/delete and text/Markdown exports.
- English/Bangla interface labels; per-message language metadata and real Bangla-keyboard testing.
- A plan workspace for assumptions, field checks, experiments and next actions. Add a deterministic budget/break-even calculator with explicit user inputs; never treat generated numbers as verified.
- Optional accounts and cross-device sync, with ownership checks, retention/deletion rules and a migration path from local plans.
- Opt-in source-backed research and cited local verification assistance.
- Feedback attached to a request ID; content submission to feedback must be deliberate, not silent telemetry.
- PDF export, file analysis, voice and payments only after the core workflow has demonstrated demand.

## References consulted

- [NVIDIA hosted model example](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b?nim=hosted): model ID, endpoint and streaming request shape.
- [MDN SSE format](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events): UTF-8 framing, multi-line data and comments. Automatic EventSource reconnect behavior does not apply to this POST/fetch client.
- [MDN keyboard composition](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/isComposing): composition state for input handling.
- [React textarea reference](https://react.dev/reference/react-dom/components/textarea): controlled input and event behavior.
- [react-markdown](https://github.com/remarkjs/react-markdown): maintained React renderer; GFM requires a plugin, and URL/HTML handling must remain deliberately constrained.
- [Vitest](https://vitest.dev/guide/) and [Playwright API mocking](https://playwright.dev/docs/mock): proposed deterministic regression tools. No new dependencies installed in this review.
