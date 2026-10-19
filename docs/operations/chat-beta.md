# BizGuide chat operations: Netlify and shared Redis

Implementation date: 19 October 2026. Target: Netlify's maintained OpenNext adapter, Node 24, NVIDIA Nemotron 3 Ultra and a Redis REST service compatible with Upstash's command endpoint.

## Architecture

In local `next dev`, the route returns app-owned SSE. The browser buffers content, shows thinking/typing, and reveals the completed answer. Interrupted content is retained.

On Netlify (`NETLIFY=true`), POST validates input and atomically reserves quota in shared Redis. It stores a session-owned job, invokes `advisor-generate-background`, and returns 202 quickly. The browser polls the authenticated job endpoint once per second. DELETE marks cancellation; the background worker checks it once per second, aborts NVIDIA and settles the reservation. Netlify background functions can run for 15 minutes, whereas ordinary synchronous functions have a 60-second limit. This avoids assuming a 180-second synchronous request is supported. See [Netlify Functions documentation](https://docs.netlify.com/build/functions/overview/).

Do not remove background authorization, expose Redis credentials to the browser, or switch production admission to a process-local counter. The local in-memory store is for development only.

## Required configuration

Set these in Netlify environment variables with **Functions and Builds** scopes, then redeploy. Runtime environment changes require a new deployment.

| Name | Purpose |
| --- | --- |
| `NVIDIA_API_KEY` | Existing NVIDIA key |
| `NVIDIA_MODEL` | `nvidia/nemotron-3-ultra-550b-a55b` |
| `UPSTASH_REDIS_REST_URL` | HTTPS Redis REST command endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Server-side Redis token with required command permissions |
| `ADVISOR_SESSION_SECRET` | Stable random secret of at least 32 characters; used for signed anonymous session cookies and derived worker authorization |
| `ADVISOR_FIRST_TOKEN_MS` | Initial model-activity deadline, default 45000; reasoning activity counts without exposing its text |
| `ADVISOR_IDLE_MS` | Maximum gap in model activity, default 45000 |
| `ADVISOR_TOTAL_MS` | Absolute generation limit, default 180000; maximum configurable 840000, below the background runtime ceiling |
| `ADVISOR_DISABLED` | `true` immediately denies new generations on the next deployed configuration |

Netlify supplies `URL`, `DEPLOY_PRIME_URL` and `NETLIFY`. Worker dispatch uses the deployment's own HTTPS URL. Do not put these secrets in `netlify.toml` or a `NEXT_PUBLIC_` variable. Generate a session secret with Node's `crypto.randomBytes(32).toString('hex')` and put it directly into the environment, never into a chat transcript or committed file.

Redis is used for transient generation data, counters and reservations, not accounts or a permanent user-plan database. Job input/output expires one hour after the last update; cancellation keys also expire. Claims expire after 15 minutes. Quota/reservation metadata expires within two days; activity leases recover after 15 minutes if a worker crashes. Device plans and pinned notes remain browser-local unless the user explicitly exports them.

## Initial limited-beta policy

- 10 attempts/minute and 100/day per signed anonymous session.
- 30 attempts/minute per salted client-IP key; use Netlify's trusted `x-nf-client-connection-ip`, not arbitrary forwarded headers.
- One active job/session, 10 active jobs globally.
- 100,000 generated-token daily allowance across the beta, accounted in UTC. Each admission reserves the full configured generation ceiling, including reasoning. If actual output usage is unavailable, retain the reservation conservatively; never infer monetary cost from trial tokens.
- All keys use the `{bizguide}` Redis Cluster hash tag. Atomic Lua scripts check/increment quotas and acquire leases together. Settlement is idempotent. Shared storage failures fail closed with 503.

These are initial product policies, not published NVIDIA limits. Validate the real adapter's EVAL/SET/ZSET permissions and concurrency under staging traffic before opening a public beta. Cookie rotation cannot bypass the IP/global controls. This is an anonymous beta policy, not full account-level abuse prevention.

## Reasoning and output

Quick mode disables thinking. Auto uses the verified `medium_effort: true` thinking control for analysis/roadmaps. Deeper thinking enables full thinking with additional token headroom. All generation, including thinking, is bounded by `max_tokens` and the absolute deadline. A separate hard thinking-token limit is not claimed: in live checks the hosted endpoint rejected `thinking_token_budget`, and documented `reasoning_budget` variants returned in-stream internal errors despite HTTP 200. The implementation therefore omits those failing options. Medium-effort thinking returned a real answer with separate reasoning deltas, whose content was discarded. See [the hosted API reference](https://docs.api.nvidia.com/nim/reference/nvidia-nemotron-3-ultra-550b-a55b-infer) and [model effort controls](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b/modelcard).

Only phase changes and answer content are transmitted to the client. Private reasoning text is discarded server-side. A `length` finish marks a truncated answer. EOF without a terminal event marks interruption. Continue is a fresh generation using labelled partial context, not a guarantee of exact resumption.

## Monitoring and incident response

`advisor_generation` logs contain request ID, configured model/mode, duration, first content timing, outcome, known usage and a safe error code. Prompts, notes, raw provider errors, raw IP addresses and API keys are excluded. Do not enable request-body logging at the hosting/proxy layer without a separate privacy decision.

For rising failures, inspect terminal codes and first-content/completion timing. For quota alarms, review the reserved daily counter and active leases without printing user job bodies. Disable new generation if necessary, fix the cause, deploy, and run a synthetic smoke check before restoring access. Preserve unknown token reservations; do not delete counters to hide usage.

## Verification status

Local source/tests and production-bundle checks are recorded in `.agency/chat-improvements/progress.md`. Redis credentials and a Netlify deployment are not present in this checkout as of implementation. Real shared-store concurrency, hosted worker invocation, Netlify proxy behavior and deployment-level cancellation therefore require staging verification; a local mocked test is not proof those external systems are configured.
