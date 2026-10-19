# BizGuide AI

A business planning workspace for entrepreneurs in Bangladesh. Describe an idea, work through the unknowns in English or Bangla, and turn the conversation into a plan you can test before launching.

[Live demo](https://bizguideai.vercel.app/) · [Quick start](#quick-start) · [How it works](#how-it-works) · [Development](#development) · [Deployment](#deployment)

[![BizGuide AI homepage showing the business idea form and an illustrative planning conversation](docs/images/bizguide-homepage.png)](https://bizguideai.vercel.app/)

## What you can do

- Explore customers, demand, location, competition, startup costs, operations, and launch risks.
- Get streamed replies in English or Bangla, with concise, detailed, and roadmap answer modes.
- Maintain a business brief with your idea, location, budget, experience, and stage so follow-up advice has context.
- Turn roadmaps into ordered steps with dependencies, deliverables, completion checks, and progress tracking.
- Pin useful advice, add personal notes, and review assumptions alongside your plan.
- Calculate revenue, contribution, profit, and break-even units from your own prices and costs in BDT.
- Save plans in a device library and export a Markdown copy with the brief, conversation, roadmap progress, and selected notes.
- Use the planning workspace on desktop and mobile.

> [!IMPORTANT]
> The advisor does not browse the web or verify live market prices, licensing requirements, or fees. Treat generated estimates as assumptions to check, not confirmed facts. BizGuide AI provides planning guidance, not financial, legal, tax, or investment advice.

## Quick start

### Prerequisites

- Git, npm, and **Node.js 24** to match the repository's [CI workflow](.github/workflows/chat-checks.yml).
- An NVIDIA API key with access to the configured model for advisor replies.

You can explore the homepage and workspace without an API key, but chat requests require one. You do not need a database or an account system to run this project.

### 1. Install dependencies

```bash
git clone https://github.com/Shahriar-Dev27/bizstudio_business.git
cd bizstudio_business
npm ci
```

### 2. Configure the advisor

Create `.env.local` in the project root and replace the API key placeholder:

```dotenv
NVIDIA_API_KEY=your_nvidia_api_key_here
# Optional: omit this line to use the default model.
NVIDIA_MODEL=nvidia/nemotron-3-ultra-550b-a55b
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `NVIDIA_API_KEY` | For chat | Server-side credential for NVIDIA's chat completions API |
| `NVIDIA_MODEL` | No | Model identifier; defaults to `nvidia/nemotron-3-ultra-550b-a55b` |

Keep the key server-side. Do not add a `NEXT_PUBLIC_` prefix or commit `.env.local`; local environment files are ignored by Git. The example above contains a placeholder, not a working credential.

### 3. Start the app

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000) for the homepage or [localhost:3000/advisor](http://localhost:3000/advisor) for the planning workspace.

### 4. Try a planning session

For example: "I want to start a home bakery in Sylhet with a BDT 70,000 budget. What should I test before buying equipment?"

Add your constraints to the business brief, ask for a roadmap, and mark steps as you complete them. Use **Save** to keep a device copy or export Markdown before leaving the browser.

## How it works

```text
Business idea + brief + conversation
                |
                v
       /advisor workspace
                |
       POST /api/advisor/chat
                |
                v
  Next.js server: validate input,
  apply advisor instructions, call NVIDIA
                |
       Server-Sent Events (SSE)
                |
                v
  Streamed reply + roadmap + notes
```

The API key stays on the server. The chat route validates requests, passes conversation context and the business brief to the provider, and streams reply events to the browser. The client supports stopping a reply and retrying interrupted responses.

### Storage and privacy

- The active conversation uses `sessionStorage`; saved plans and pinned notes use `localStorage` in the current browser.
- The device library supports up to 10 plans, with up to 100 messages per saved plan. Browser storage quotas can impose additional limits.
- There is no account-based cloud sync or application database. Clearing site data removes browser-stored plans and notes; export important work as Markdown.
- Local storage does not mean offline AI: chat requests send conversation context and the business brief through the server to NVIDIA. Avoid including secrets or sensitive personal information.

## Built with

| Area | Technology |
| --- | --- |
| Application | Next.js 16 App Router, React 19, TypeScript |
| Interface and motion | Tailwind CSS 4, GSAP, Anime.js, Lucide icons |
| AI integration | NVIDIA chat completions API, server-side streaming with SSE |
| Reply rendering | React Markdown with GitHub Flavored Markdown support |
| Tests | Vitest, React Testing Library, Playwright |

Dependency versions and commands live in [`package.json`](package.json).

## Development

### Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build; run `build` first |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript types |
| `npm test` | Run unit and component tests |
| `npm run test:e2e` | Run desktop and mobile-viewport browser tests against a running app |
| `npm run test:live` | Evaluate real advisor responses against a running app with a configured API key |

### Local checks

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

The [GitHub Actions workflow](.github/workflows/chat-checks.yml) runs these checks on pushes and pull requests, then starts the production server for mocked browser tests.

### Browser tests

Install Chrome through Playwright once:

```bash
npx playwright install chrome
```

Start the app in one terminal with `npm run dev`, then run this in another:

```bash
npm run test:e2e
```

Tests use mocked advisor responses, so an NVIDIA API key is not required. Playwright does not start the app automatically. Set `E2E_BASE_URL` in the test process environment if the app runs somewhere other than `http://localhost:3000`.

### Live advisor evaluations

With the app running and its server configured with `NVIDIA_API_KEY`:

```bash
npm run test:live
```

This makes real provider requests and consumes provider quota. Cases come from [`tests/evaluations/advisor-cases.json`](tests/evaluations/advisor-cases.json); results are written to the Git-ignored `docs/evaluations/advisor-live-results.json`. Automatic checks do not replace human review of business advice.

Optional environment variables for the evaluation process:

| Variable | Purpose |
| --- | --- |
| `ADVISOR_EVAL_BASE_URL` | Target app URL; defaults to `http://localhost:3000` |
| `ADVISOR_EVAL_CASES` | Comma-separated case IDs to run |
| `ADVISOR_EVAL_FRESH` | Set to `true` to ignore saved results and rerun cases |

### Source map

| Path | What to look for |
| --- | --- |
| [`app/page.tsx`](app/page.tsx) | Homepage composition |
| [`app/advisor/`](app/advisor/) | Planning workspace page and styles |
| [`app/api/advisor/chat/route.ts`](app/api/advisor/chat/route.ts) | Request validation, streaming response, cancellation, and metrics |
| [`components/chat/`](components/chat/) | Composer, transcript, business brief, roadmap, device library, and calculator UI |
| [`components/marketing/`](components/marketing/) | Homepage sections and motion |
| [`hooks/use-advisor-chat.ts`](hooks/use-advisor-chat.ts) | Client chat lifecycle and session state |
| [`lib/advisor-prompt.ts`](lib/advisor-prompt.ts) | Bangladesh-focused advisor instructions |
| [`lib/chat/provider.ts`](lib/chat/provider.ts) | Model settings, provider requests, stream parsing, and deadlines |
| [`lib/chat/`](lib/chat/) | Storage, roadmap parsing, budget calculations, limits, and chat state |
| [`types/`](types/) | Shared advisor and chat types |
| [`tests/`](tests/) | Unit, component, browser, and evaluation cases |

## Deployment

To deploy to Vercel:

1. Import the GitHub repository as a Next.js project.
2. Select Node.js 24 to match CI.
3. Add `NVIDIA_API_KEY` to the server environment for each deployment environment that needs chat. Add `NVIDIA_MODEL` only to override the default.
4. Deploy, open `/advisor`, and send a short question to check streaming end to end.

The advisor API uses the Node.js runtime and requires server-side execution; a static export alone cannot serve chat requests. On other hosts, ensure the server can reach NVIDIA and that proxies pass SSE responses through without buffering. Check the host's function timeout against the provider's [configured deadlines](lib/chat/provider.ts).

For a local production run:

```bash
npm run build
npm run start
```

> [!WARNING]
> The chat endpoint has no user authentication or application-level rate limiter. Same-origin checks and payload limits are not abuse protection. Before operating a public deployment, add appropriate access controls, rate limits, and usage monitoring to protect the provider key and quota.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Homepage works, but the advisor is unavailable | Confirm `NVIDIA_API_KEY` is set in the server environment and has access to the configured model. Restart the development server after changing `.env.local`. |
| Reply times out, stops, or asks you to wait | Retry after checking the provider connection and quota. For hosted deployments, also check function timeouts and SSE buffering. Partial replies remain visible. |
| A plan will not save | Check browser storage permissions and quota. The device library is limited to 10 plans and 100 messages per saved plan; export and remove an older plan if needed. |
| Browser tests cannot connect | Start the app first and check that `E2E_BASE_URL` matches its address. |
| Playwright cannot launch Chrome | Run `npx playwright install chrome`; the test configuration uses the Chrome channel. |

Keep source, tests, configuration, and `package-lock.json` in Git. Dependencies, build output, local secrets, agent artifacts, and generated reports are excluded by [`.gitignore`](.gitignore).
