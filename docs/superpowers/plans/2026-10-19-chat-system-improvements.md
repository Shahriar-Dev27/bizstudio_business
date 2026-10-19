# Chat System Improvements Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` to implement this plan task by task. The user authorized execution on 19 October 2026, including the amendments below. Deployment and external account provisioning are not authorized by this implementation request.

## Execution amendments — approved 19 October 2026

1. Add `reasoning: 'auto' | 'quick' | 'deep'` and `mode: 'concise' | 'detail' | 'roadmap'` to the shared request contract. Auto reasoning uses deeper thinking for analysis/roadmaps; quick requests remain efficient. Use NVIDIA's documented thinking controls, verify budgets live, and keep reasoning trace server-side.
2. Task 3/4 buffer answer content behind honest thinking/typing statuses and reveal it on completion; retain recoverable partial content on Stop/failure. Include progress events without sending private reasoning text.
3. Task 5 implements selection-based pinning, not per-line controls. Pin only a nonempty selection contained in one assistant answer, within the 500-character note limit. Roadmap steps have explicit Pin step actions.
4. Add Task 14: validated roadmap/workflow diagrams. A strict `roadmap` JSON block describes 3–8 steps with IDs, titles, action, deliverable, completion check, timing and dependencies. Show ordered cards and connecting arrows with a text alternative, selected-step pinning, saved completion state and export. Reject invalid references/cycles/oversized content and render a readable fallback. Never execute model HTML or arbitrary diagram code.
5. Tasks 12–13 are now part of this execution: device plan library, exports, Bangla UI, plan workspace and deterministic BDT calculator. Infrastructure-dependent deployment checks remain explicitly pending until configured. Phase E is future planning, not a demand to create unchosen external accounts.
6. Add tests for completed-answer reveal, reasoning progress without reasoning exposure, roadmap intent in English/Bangla/Banglish, valid/cyclic/malformed diagrams, step completion persistence, selection-only pinning, and precise response instructions.

The amendments override conflicting original defaults. Execute Task 14 after Tasks 5/7/8 and integrate it with Tasks 12/13.

**Goal:** Make BizGuide a dependable public MVP for entrepreneurs in Bangladesh, then extend it with saved plans and useful planning tools.

**Architecture:** Preserve the existing Next.js/React interface and NVIDIA model. Introduce a small shared request contract, bounded history builder, server stream adapter, explicit conversation state machine and resilient storage. Put public admission controls and measured release gates around the same route.

**Tech stack:** Existing Next.js 16, React 19 and TypeScript; proposed Vitest, React Testing Library and Playwright for behavior tests; proposed react-markdown with remark-gfm for answer rendering. Resolve compatible package versions and commit the lockfile when implementing; no dependencies have been installed for this plan.

**Spec:** [Chat system review and proposed design](../specs/2026-10-19-chat-system-review-design.md). Read it first for evidence, priorities and exact proposed limits.

## Global constraints

- Target a public MVP for Bangladesh entrepreneurs; public beta comprises phases A, B and C in the spec.
- Retain `nvidia/nemotron-3-ultra-550b-a55b`; use `NVIDIA_API_KEY` on the server only; thinking remains disabled.
- Preserve Paper Arcade styling and homepage behavior outside explicitly listed handoff/disclosure work.
- Never remove non-empty partial output on Stop, timeout, disconnect or retry.
- No duplicate user turn on Retry; old attempts cannot mutate a new conversation or newer attempt.
- No automatic provider replay after content has appeared; Continue is a new generation, not guaranteed stream resumption.
- User input 2–4,000 characters; prior assistant content up to 12,000; wire history at most 24 messages; history text at most 60,000 characters; actual UTF-8 body at most 128 KiB; business brief at most 2,048 characters.
- Concise mode target at most 250 words / 900 output tokens; detail mode 1,800 output tokens initially.
- Initial configurable deadlines: first content 45 s, content-idle 45 s, total 180 s; client recovery total + 10 s. Verify host capability before adopting these production values.
- Public controls: 10 attempts/minute and 100/day/session, 30/minute/IP, one active/session, 10 active globally, global 100,000 generated-token daily beta cap. These are tunable product policies, not NVIDIA limits. Reserve worst-case output tokens before admission.
- Use a shared atomic production admission store; a process-local development limiter is not a public-production fallback. Fail closed with 503 if the production store is unavailable.
- Notes: 60/device, 500 characters/note; explicit durable saves: at most 10 plans and 100 displayed messages/plan initially. Never silently discard overflow.
- Default logs exclude conversation text, notes, API keys, raw provider bodies and full business-idea URLs.
- No claims of live market research or verified current rules without actual sources.
- Respect existing uncommitted work; commit only scoped files if committing during implementation.

## Review focus

1. Mid-answer socket loss must preserve text and mark it interrupted rather than complete. Owned by Tasks 2–4.
2. Delayed callbacks after Stop, Retry or New Plan must not affect another attempt. Owned by Task 3 and integration in Task 4.
3. Bangla input/output must survive IME composition, split UTF-8 bytes and reload. Owned by Tasks 1, 2, 6 and 7.
4. Storage disabled/quota exceeded and clipboard denied must not erase work or falsely report a save/copy. Owned by Task 7.
5. Multi-instance quota races, provider cancellation and unknown token usage must not overspend or leak active reservations. Owned by Task 10.

## Contract and file map

Create these interfaces in `types/chat.ts`; all IDs are strings, timestamps epoch milliseconds, and protocol version is exactly `1`:

```ts
type MessageStatus = 'pending' | 'streaming' | 'complete' | 'interrupted' | 'failed' | 'truncated';
type AnswerMode = 'concise' | 'detail';
type WireMessage = { role: 'user' | 'assistant'; content: string };
type BusinessBrief = {
  idea?: string; location?: string; budgetBdt?: number;
  experience?: string; stage?: string; language?: 'en' | 'bn' | 'banglish';
};
type AdvisorRequest = {
  version: 1; conversationId: string; turnId: string; attemptId: string;
  messages: WireMessage[]; profile?: BusinessBrief; mode: AnswerMode;
};
type ChatEvent =
  | { type: 'start'; requestId: string; attemptId: string }
  | { type: 'delta'; requestId: string; attemptId: string; text: string }
  | { type: 'finish'; requestId: string; attemptId: string; reason: 'stop' | 'length' }
  | { type: 'error'; requestId: string; attemptId: string; code: ChatErrorCode; retryable: boolean };
type ChatErrorCode = 'invalid_request' | 'payload_too_large' | 'not_configured'
  | 'rate_limited' | 'budget_exhausted' | 'provider_unavailable'
  | 'provider_timeout' | 'protocol_error' | 'cancelled';
```

Extend `types/advisor.ts` for a stable `turnId`, message status and optional `attemptId`; migrate the old `streaming` boolean at the integration task. Store the welcome as UI-only content excluded from wire history. Public errors are `{code, message, requestId, retryable, retryAfterSeconds?}`. Keep the privileged system prompt server-owned. Business brief fields remain labelled user context.

File responsibilities:

| File | Responsibility |
| --- | --- |
| `lib/chat/limits.ts`, `history.ts` | Shared bounds, wire validation, complete-turn selection |
| `lib/chat/sse.ts`, `provider.ts` | Incremental framing and NVIDIA response lifecycle |
| `lib/chat/reducer.ts`, `hooks/use-advisor-chat.ts` | State transitions and attempt orchestration |
| `lib/chat/storage.ts` | Validated session and opt-in device persistence |
| `lib/chat/admission.ts`, `telemetry.ts` | Atomic reservations and metadata-only operational evidence |
| `components/chat/*` | Focused transcript/composer/status/brief UI |
| Existing route / advisor / notes / message components | Integrate and preserve the existing product surface |

## Phase A — reliable conversation

### Task 1: Bounded request history and shared validation

**Addresses:** F03, part of F07/F11/F17. **Effort:** medium. **Depends on:** none.

**Files:** create `types/chat.ts`, `lib/chat/limits.ts`, `lib/chat/history.ts`, `tests/chat/history.test.ts`, `vitest.config.ts`, `tests/setup.ts`; modify `package.json`, lockfile, client history construction and route validation.

**Interfaces:** `buildRequestHistory(messages: ChatMessage[], currentUser: ChatMessage, envelope: Omit<AdvisorRequest, 'messages'>): WireMessage[]`; `validateAdvisorRequest(value: unknown): AdvisorRequest`; typed validation errors expose a `ChatErrorCode`. History selection keeps recent completed user/assistant pairs plus the latest user, excludes UI welcome and failed attempts, and removes oldest pairs until character and encoded request budgets fit. Measure the encoded body with the actual envelope, including IDs, mode and profile. Treat interrupted content only through an explicit Continue path.

- [ ] Add Vitest and React Testing Library setup, with `test: "vitest run"`; create red regressions for `forty_turn_chat_keeps_latest_question`, `bangla_history_obeys_utf8_budget`, `failed_attempt_is_not_history`, `welcome_is_not_sent`, and `malformed_request_is_rejected`.
- [ ] Assert a 40-turn transcript produces at most 24 wire messages, retains the current question exactly once, does not orphan an assistant message, stays at most 60,000 history characters and within 131,072 encoded request bytes. Assert a 4,001-character user message and system role fail validation.
- [ ] Run `npm.cmd run test -- tests/chat/history.test.ts`; confirm the intended failures before implementation.
- [ ] Implement shared limits and builder; immediately use the history builder in the existing client so the current route no longer hits its 30-message cliff. Introduce versioned request validation alongside the current route shape only until Task 4 performs the atomic protocol switch.
- [ ] Run the history suite, typecheck and lint. Confirm all pass; a normal UI message still reaches the current provider path. Commit this scoped deliverable if using commits.

### Task 2: Tested NVIDIA stream adapter and deadline policy

**Addresses:** F01/F06 and part of F16/F17. **Effort:** medium–large. **Depends on:** Task 1.

**Files:** create `lib/chat/sse.ts`, `lib/chat/provider.ts`, `tests/chat/sse.test.ts`, `tests/chat/provider.test.ts`, `tests/fixtures/chat-streams.ts`.

**Interfaces:** `readSse(body: ReadableStream<Uint8Array>, signal: AbortSignal): AsyncGenerator<{event?: string; data: string}>`; `openNvidiaStream(input: AdvisorRequest, options: {requestId: string; signal: AbortSignal; deadlines: {firstContentMs: number; idleMs: number; totalMs: number}}): Promise<{events: AsyncIterable<ChatEvent>; close: () => Promise<void>}>`. Export a `ProviderError` carrying a normalized code, safe message, HTTP status and optional retry delay. The adapter includes the server prompt and validated brief context, and never forwards reasoning fields.

- [ ] Write red tests for bytes split inside Bangla characters, split `data:` prefixes, CRLF/LF event delimiters, comments, multi-line data joined with `\n`, malformed JSON, empty choices, terminal stop, length cap, EOF without terminal event, and provider errors before/after the first delta.
- [ ] Use fake timers to assert first-content/idle/total expiry at 45,000/45,000/180,000 ms, content progress resets only idle, and heartbeats cannot keep a stalled generation alive indefinitely. Assert upstream cancellation and `close()` are idempotent.
- [ ] Run `npm.cmd run test -- tests/chat/sse.test.ts tests/chat/provider.test.ts`; verify red failures. Implement the adapter independently of the live route.
- [ ] Assert the request uses the NVIDIA endpoint, configured/default model, server key, `enable_thinking: false` and mode token budget; no raw provider authentication error appears in a public error event.
- [ ] Rerun both suites, typecheck and lint. Commit a passing adapter; do not switch the live route before Task 4.

### Task 3: Turn state machine, retry and cancellation isolation

**Addresses:** F02/F04/F05/F06. **Effort:** medium–large. **Depends on:** Tasks 1–2 contracts.

**Files:** create `lib/chat/reducer.ts`, `hooks/use-advisor-chat.ts`, `tests/chat/reducer.test.ts`, `tests/chat/use-advisor-chat.test.tsx`; extend `types/advisor.ts`.

**Interfaces:** `chatReducer(state: ChatState, action: ChatAction): ChatState`; `useAdvisorChat(initial: ChatState): {state: ChatState; send(text: string, mode?: AnswerMode): Promise<void>; retry(turnId: string): Promise<void>; continueTurn(turnId: string): Promise<void>; stop(): void; newConversation(): void}`. Define/export `ChatState` and `ChatAction` in `types/chat.ts`. State includes conversation generation, active attempt, transcript, draft, profile, error and phase. Inject/mock the network boundary in tests, not reducer behavior.

- [ ] Reproduce the six handler failures from the review as red maintained tests: `retry_keeps_one_user_turn`, `stop_preserves_partial`, `eof_is_interrupted`, `length_is_truncated`, `new_plan_ignores_old_error`, and `old_attempt_cannot_finish_new_attempt`.
- [ ] Assert Stop preserves `"Useful partial advice"`; Retry retains the original user `id` and creates a new attempt ID; a previous non-empty partial remains accessible in attempt history after Retry; EOF after text is interrupted, never complete; `length` is truncated; delayed old errors leave the new conversation's error empty and sending state unchanged.
- [ ] Implement reducer transitions and hook. Define `AttemptSnapshot` in `types/chat.ts` with attempt ID, content, terminal status and creation time, and retain it for previous non-empty attempts on the same turn. Use request-local text buffers and a synchronous active-attempt guard to prevent rapid double sends. Check generation/attempt validity before every state update, including `finally`.
- [ ] Implement explicit Continue with linked context; do not append a duplicate original question or imply exact continuation is guaranteed.
- [ ] Run `npm.cmd run test -- tests/chat/reducer.test.ts tests/chat/use-advisor-chat.test.tsx`, typecheck and lint. Commit once passing.

### Task 4: Integrate protocol, route and recovery UI together

**Addresses:** F01–F06/F17 integration. **Effort:** medium. **Depends on:** Tasks 1–3.

**Files:** modify `app/api/advisor/chat/route.ts`, `components/advisor-experience.tsx`, `types/advisor.ts`, `.env.example`; create `components/chat/turn-status.tsx`, `tests/chat/route.test.ts`, `tests/e2e/chat-recovery.spec.ts`, `playwright.config.ts`; add `test:e2e: "playwright test"`.

- [ ] Write route tests asserting JSON before response headers and app SSE events afterward; request body limit applies with absent/incorrect Content-Length; malformed requests never call the provider. Test provider 401/configuration as safe 503, rate limit as 429, network failure as 502 and timeout as 504 before headers.
- [ ] Write browser tests for successful streaming, mid-stream disconnect, Stop, Retry, Continue and New Plan during a request. Assert visible text/status and request payloads rather than CSS class snapshots.
- [ ] Switch route and hook usage in the same change to protocol version 1; remove the temporary legacy request shape. Wire public status copy: Receiving reply, Writing, Completed, Stopped, Connection interrupted, Answer cut short. Keep a usable request reference in error details.
- [ ] Combine client disconnect/cancel and server deadlines; close upstream on reader cancellation and route abort. Track a terminal outcome even when the response socket is already gone. Keep provider config/deadline environment values server-only.
- [ ] Run `npm.cmd run test -- tests/chat/route.test.ts`, `npm.cmd run test:e2e -- tests/e2e/chat-recovery.spec.ts`, full unit suite, typecheck and lint. A simulated answer lasting over 90 seconds must either finish within configured host-supported limits or retain a labelled partial answer; no generic error erases it.
- [ ] Commit after the route and UI work together. This is the first coherent reliability milestone; do one concise live NVIDIA smoke request and one deliberate interrupted stream after deterministic checks pass.

## Phase B — useful everyday chat

### Task 5: Readable and safe answer rendering

**Addresses:** F09. **Effort:** medium. **Depends on:** Task 4.

**Files:** modify `components/advisor-message.tsx`, `app/advisor/advisor.css`, dependency files; create `tests/chat/message-rendering.test.tsx` and `tests/e2e/chat-markdown.spec.ts`.

- [ ] Create red tests: three-step instructions render an ordered list with three list items; a GFM budget table has column headings and scrolls inside its container; links with `javascript:` cannot navigate; raw HTML cannot execute; Bangla text and incomplete streaming Markdown remain readable.
- [ ] Add react-markdown and remark-gfm with raw HTML disabled and constrained link handling. Preserve pinning at stable paragraph/list-item blocks rather than pinning table separators or each transient token fragment. Memoize settled message cards.
- [ ] Test that a pinned recommendation retains readable text and message provenance. Untrusted links should not be presented as verified sources.
- [ ] Run rendering tests and the browser spec at desktop and 390 px wide; assert page width does not grow. Run full unit suite, typecheck and lint; commit the verified renderer.

### Task 6: Composer, reading position and accessible statuses

**Addresses:** F12/F13 and part of F18. **Effort:** medium. **Depends on:** Tasks 3–5.

**Files:** create `components/chat/chat-composer.tsx`, `components/chat/chat-transcript.tsx`, `tests/chat/composer.test.tsx`, `tests/e2e/chat-reading.spec.ts`; modify the workspace and advisor CSS.

- [ ] Write red tests: Enter with composition active sends zero requests; plain Enter sends once; Shift+Enter adds a newline; duplicate rapid submission sends one request; scrolling up during generation does not move the reader to the bottom.
- [ ] Respect composition start/end and `nativeEvent.isComposing`; add a tested legacy-key guard only if real keyboard evidence requires it. Grow the composer to a bounded height and retain labelled Send/Stop controls.
- [ ] Follow new text only when within 80 px of the transcript bottom. Otherwise show Jump to latest; clicking it resumes following. Batch text updates at most once per animation frame, with a timer fallback for background tabs.
- [ ] Announce coarse status changes once rather than every token; preserve focus-visible, reduced-motion behavior and notes-dialog keyboard containment. Set per-message language when known; do not guess a confirmed preference solely from script detection.
- [ ] Run composer unit and reading browser tests, plus manual actual Bangla IME, Android/iOS keyboard, reduced-motion, and screen-reader checks. Mark untested physical-device checks explicitly; do not claim device coverage from viewport emulation. Commit after automated checks pass.

### Task 7: Session recovery and resilient notes

**Addresses:** F10/F14. **Effort:** medium. **Depends on:** Tasks 3–6.

**Files:** create `lib/chat/storage.ts`, `tests/chat/storage.test.ts`, `tests/e2e/chat-recovery-storage.spec.ts`; modify hook and `components/pinned-notes.tsx`, notes persistence and related public copy.

**Interfaces:** `loadSession(): SavedConversation | null`; `saveSession(value: SavedConversation): {ok: boolean; reason?: 'unavailable' | 'quota' | 'invalid'}`; `validateStoredNotes(value: unknown): PinnedNote[]`. `SavedConversation` is exported from `types/chat.ts`, has `schemaVersion: 1`, transcript, draft, profile, ID and update time. Keep session data in sessionStorage; explicit durable device saves are Task 12.

- [ ] Test reload restores the draft and transcript; a restored streaming message becomes interrupted; invalid/older data does not crash; storage exceptions retain in-memory data and show Unsaved; unavailable clipboard does not show Copied.
- [ ] Enforce 60 notes on insertion and restoration without silent loss; validate IDs/text/timestamps/provenance, migrate the existing `bizguide-pinned-notes-v1` format, and handle duplicate edits and full storage visibly.
- [ ] Add guarded session autosave, debounced during generation with a final flush. Avoid writing the entire transcript for every token. New Plan preserves an undo snapshot; returning with Undo restores the same text and notes association.
- [ ] Make note-copy errors actionable; retain user text when save/copy fails. Associate new pins with conversation/turn; migrate old unassigned notes into a labelled legacy group.
- [ ] Run storage unit/browser suites, full unit suite, typecheck and lint. Test reload while offline and corrupted/quota-blocked storage before commit.

### Task 8: Editable business brief and concise, evidence-conscious advice

**Addresses:** F08/F11. **Effort:** medium–large. **Depends on:** Tasks 1, 4 and 7.

**Files:** create `components/chat/business-brief.tsx`, `lib/chat/brief.ts`, `tests/chat/brief.test.ts`, `tests/evaluations/advisor-cases.json`, `docs/evaluations/advisor-rubric.md`; modify `lib/advisor-prompt.ts`, provider request builder and hook.

**Interfaces:** `validateBusinessBrief(value: unknown): BusinessBrief`; `buildAdvisorMessages(request: AdvisorRequest): WireMessage[]` in `lib/chat/provider.ts`, with server-owned system instructions handled separately from the user-role context. Brief fields never become privileged instructions.

- [ ] Test a changed budget supersedes the old brief value, original location survives 40 turns, unknown information stays unknown, negative/NaN budget fails validation, over-2,048-character profile fails, and an injected brief field cannot create a system-role instruction.
- [ ] Implement a small editable brief for idea/location/budget/experience/stage/language. Use user confirmation for facts; do not silently summarize assumptions into confirmed profile fields. Keep it optional so onboarding remains conversational.
- [ ] Change default prompt to a concise recommendation or at most three high-value clarifying questions. Offer detail as a follow-up. Require estimates and verification items to be labelled; prohibit invented current rules, exemptions, citations and guaranteed returns.
- [ ] Write the 32-case rubric described by the spec. Each case records prompt, context, required qualities and disallowed claims. Run live evaluations deliberately using the selected model; record outputs and results in `docs/evaluations/2026-10-19-advisor-results.md` when actually run, with the real run date if later.
- [ ] Gate release on zero critical unsupported claims/citations and at least 28/32 useful results; record failures instead of changing the rubric to make them pass. Run brief/provider tests, typecheck and lint before commit. Evaluation outcomes remain measured observations, not correctness guarantees.

## Phase C — public beta readiness

### Task 9: Correct public disclosure and private draft handoff

**Addresses:** F15 and persistence messaging from F10. **Effort:** small–medium. **Depends on:** Tasks 4 and 7.

**Files:** modify `components/marketing/faq-section.tsx`, `components/marketing/notes-section.tsx`, `components/hero-form.tsx`, `components/marketing/business-examples.tsx`, workspace initial-draft handling; create `lib/chat/draft-handoff.ts`, `tests/e2e/chat-handoff.spec.ts`.

- [ ] Audit every current idea handoff, including marketing examples. Write browser tests showing a homepage idea opens as an editable draft, is not in the destination query string, and causes zero provider calls before Send.
- [ ] Use a bounded sessionStorage handoff consumed once, then navigate to `/advisor`. If storage is unavailable, retain the idea in the homepage input and explain how to open/copy it; do not silently discard it or fall back to a URL containing the idea.
- [ ] Correct the FAQ to NVIDIA and explain transmitted history/brief, tab recovery, opt-in durable device saves and no live lookup. Check applicable provider data-handling terms before adding retention or training claims.
- [ ] Support existing `/advisor?idea=` links for this migration: prefill once, clean the address with replace navigation, and do not auto-send. A server already received the original URL, so do not claim this erases earlier history/logs.
- [ ] Run handoff browser tests, full unit suite, typecheck and lint. Commit updated product behavior and matching copy together.

### Task 10: Public admission, budget reservations and observability

**Addresses:** F07/F16. **Effort:** large; infrastructure-dependent. **Depends on:** Task 4; can proceed alongside Phase B after the hosting decision.

**Decision before implementation:** choose the deployment host and a shared atomic storage adapter; document both in `docs/operations/chat-beta.md`. Confirm duration/streaming limits and trusted proxy headers. Choose actual services based on the user's deployment context; do not create external accounts or claim production protection from a placeholder adapter.

**Files:** create `lib/chat/admission.ts`, the chosen `lib/chat/admission-store.ts`, `lib/chat/telemetry.ts`, `tests/chat/admission.test.ts`, `tests/chat/telemetry.test.ts`, `docs/operations/chat-beta.md`; modify route and `.env.example`.

**Interfaces:** `reserveGeneration(input: {sessionId: string; ipKey: string; attemptId: string; maxOutputTokens: number}): Promise<AdmissionDecision>`; accepted decisions return a reservation ID; rejected decisions return a public code and retry delay. `settleGeneration(reservationId: string, result: {outcome: string; generatedTokens?: number}): Promise<void>` is idempotent. Adapter operations are atomic across processes; reservations have expiry/reconciliation rules.

- [ ] Test the exact session/IP/global limits and daily cap in the spec. Simultaneous admissions from two simulated server instances cannot both win the last slot. Rejected requests make zero provider calls; store outage returns 503; session cookie rotation cannot defeat IP/global caps.
- [ ] Test completion, Stop, exception, lost socket and worker crash/expiry release active slots exactly once. Unknown output usage keeps the worst-case daily token reservation; known usage settles conservatively. Do not reset quota on an ambiguous client retry.
- [ ] Implement a signed, secure, same-site anonymous session cookie and trusted-proxy IP handling. Rate-limit only after validating body size/shape and before provider calls; require same-origin browser requests as additional protection, not as a substitute for shared quotas.
- [ ] Record request ID, model, mode, first-content/completion timing, terminal reason, safe error code and known/reserved usage. Test logs contain no fixture prompt, note, raw IP, API key or provider error body. Use an operationally scoped salted IP key rather than raw address logs.
- [ ] Return friendly limit/unavailable messages with Retry-After when applicable, a request reference and no raw provider details. Provide a server-side kill switch that denies new generations without changing the browser bundle.
- [ ] Run admission/telemetry tests against the real selected adapter in staging, plus full unit suite, typecheck and lint. Document quota settings, reset accounting, alerts and incident steps. Public launch is blocked until this passes.

### Task 11: End-to-end release gate and measured beta

**Addresses:** F17; validates all MVP fixes. **Effort:** medium. **Depends on:** Tasks 1–10.

**Files:** expand `tests/e2e/chat-*.spec.ts`; create `.github/workflows/chat-checks.yml` if GitHub Actions is the chosen CI, `docs/operations/chat-release-checklist.md` and `docs/evaluations/chat-beta-metrics.md`.

- [ ] Run deterministic full coverage: 40-turn conversation, split UTF-8, token cap, slow first byte, stalled stream, late network failure, Stop/Retry/New Plan races, reload, storage failure, IME, unsafe Markdown links, and admission denial.
- [ ] Run `npm.cmd run test`, `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run test:e2e`, and a production build in an isolated checkout or with the dev server safely separated. Do not disrupt another running server's `.next` output. All release checks must pass.
- [ ] In the actual deployment, verify progressive output rather than buffered delivery, host maximum duration, first/idle/total timeout behavior and upstream cancellation. One short live NVIDIA smoke is required; include one realistic detailed plan and a deliberate Stop. Record actual results, not only mocked browser success.
- [ ] Complete the 32-case quality gate and actual mobile/keyboard/screen-reader checks. Track remaining limitations openly; no critical work-loss, stale-request mutation, quota or invented-source regression may remain.
- [ ] Start a limited beta only after deployment is explicitly authorized. Measure first-content p50/p95, completion/interruption rates, timeouts, usage reservations and feedback over at least 100 consented attempts; exclude intentional Stops from provider-failure rate. These are measurement targets, not current performance claims.
- [ ] Expand access only when normal supported requests achieve at least 95% completed responses in that sample, the critical regressions remain absent, and operational alerts/budget controls work. If NVIDIA latency prevents this, revisit response size/deadlines or a separately approved provider strategy; do not hide failures in the metric.

## Phase D — subsequent product increments

### Task 12: Explicit device saves, plan library and simple export

**Addresses:** F10/F18 product depth. **Effort:** medium. **Depends on:** public beta feedback plus Tasks 7–9.

**Files:** create `lib/chat/plan-library.ts`, `lib/chat/export-plan.ts`, `components/chat/plan-library.tsx`, tests for both modules and browser resume/export; modify workspace and public persistence copy.

**Interfaces:** `saveDevicePlan(plan: SavedConversation): StorageResult`; `listDevicePlans(): PlanSummary[]`; `exportPlanMarkdown(plan: SavedConversation, notes: PinnedNote[]): string`; export associated types from `types/chat.ts`.

- [ ] Test explicit Save on this device, rename, resume, archive/delete with recovery, and export. At limits of 10 plans or 100 displayed messages, offer export/archive before any removal; never silently trim persisted work.
- [ ] Implement schema-versioned saves with clear device-only scope, no account requirement, storage failure feedback and no hidden cloud upload. Resolve multi-tab conflicts with a revision check and visible conflict message rather than last-write-wins data loss.
- [ ] Export the brief, labelled message statuses, selected notes and next actions to Markdown/text. Do not mark generated estimates as verified facts. Validate an exported plan can be understood without the original chat.
- [ ] Run module/browser suites, typecheck and lint. Use a few entrepreneur usability sessions to check whether people can resume and act on a plan before adding more features.

### Task 13: Bangla interface and actionable plan workspace

**Addresses:** F18. **Effort:** medium–large. **Depends on:** Phase C and evidence from Task 12.

**Files:** proposed `lib/chat/strings.ts`, `components/chat/plan-workspace.tsx`, `lib/chat/budget-calculator.ts`, locale/calculator/browser tests; refine with a separate focused design before implementation.

- [ ] Localize core composer/status/error/notes/brief labels in English and Bangla; test long labels, numerals, font fallback and language metadata with real users. Preserve language choice across session recovery.
- [ ] Turn selected recommendations into editable assumptions, field checks, demand experiments and next actions with completion state. Keep confirmed facts separate from generated suggestions.
- [ ] Add a deterministic BDT calculator only with explicit inputs, units and assumptions; test revenue, contribution, fixed costs, break-even and invalid/zero/negative inputs. Give ranges/scenarios without generated price claims.
- [ ] Revisit the unused demo `components/analysis-report.tsx`: remove it if obsolete or build a connected, clearly labelled report separately. Do not present the current demonstration component as a generated user plan.
- [ ] Run locale/calculator/browser suites and usability checks. Add PDF export only when users need it and the text export/workspace is already useful.

## Phase E — separate design work, not MVP blockers

| Capability | First planning task | What must be resolved before implementation |
| --- | --- | --- |
| Accounts and cloud sync | Design ownership and local-to-cloud migration | Authentication choice, per-user access controls, deletion/retention, conflict handling and costs |
| Cited local research | Design source-backed retrieval | Sources, retrieval dates, citation verification, content-injection handling, SSRF/link safety and failure behavior |
| Document analysis | Design consent and file processing | Upload/storage scope, parser isolation, limits and content deletion |
| Voice | Validate actual need and language quality | Bangla/Banglish transcription, privacy, cost and text-equivalent controls |
| Payments/team access | Validate paying use cases | Product tiers, entitlements, billing provider and support obligations |
| Multi-provider fallback | Measure the reason for fallback | Budget, model behavior, disclosure and no hidden replay of partial answers |

## Coverage, order and completion rules

Recommended sequence: **1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11**. Hosting/admission infrastructure selection can start after Task 4. Tasks 12–13 follow evidence from beta. Phase E capabilities each require a separate focused plan.

Coverage map: F01→2/4, F02→3/4, F03→1, F04/F05→3/4, F06→2/3/4, F07→1/10, F08→8/11, F09→5, F10→7/12, F11→1/8, F12/F13→6, F14→7, F15→9, F16→2/10, F17→1–11, F18→6/12/13 and Phase E.

Effort labels are relative scope estimates, not delivery promises; infrastructure selection, model evaluation results and actual device testing affect schedule. The first implementation milestone is Task 4: a conversation that preserves work and handles failure correctly. Public beta requires Task 11, not merely that milestone.

This review/planning task is complete when the assessment and roadmap are written and checked. No task boxes above are checked because no planned implementation has been performed. Execution should begin with Task 1 only after the user chooses to proceed with implementation.
