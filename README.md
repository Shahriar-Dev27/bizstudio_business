# BizGuide AI

An AI business planning partner for entrepreneurs in Bangladesh. Turn a rough idea into practical questions, a business brief, and small steps to test before launching.

**[Visit the live website](https://bizguideai.vercel.app/)**

[![BizGuide AI homepage showing the business idea form and an illustrative planning conversation](docs/images/bizguide-homepage.png)](https://bizguideai.vercel.app/)

## Features

- Explore customers, demand, location, competition, budgets, operations, and launch risks.
- Chat in English or Bangla with streamed AI responses.
- Choose concise advice, detailed analysis, or a roadmap with actionable steps.
- Keep a business brief with your idea, location, budget, experience, and stage.
- Track roadmap progress, pin notes, save plans on your device, and export plans as Markdown.
- Use a responsive interface on desktop and mobile.

Plans are stored in the current browser. There is no account-based cloud sync. The advisor does not browse the web or look up live market prices; estimates and local requirements need independent verification.

## Built with

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, GSAP, Anime.js, and NVIDIA's chat completions API. Tests use Vitest, React Testing Library, and Playwright.

## Run locally

Use **Node.js 24** and npm to match the GitHub Actions workflow.

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/Shahriar-Dev27/bizstudio_business.git
   cd bizstudio_business
   npm ci
   ```

2. Create `.env.local` in the project root:

   ```dotenv
   NVIDIA_API_KEY=your_nvidia_api_key_here
   # Optional: this is the default model.
   NVIDIA_MODEL=nvidia/nemotron-3-ultra-550b-a55b
   ```

   Replace the placeholder with your NVIDIA API key. The key is used by the server and must stay out of Git and client-side code. The homepage runs without a key; advisor requests require one.

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [localhost:3000](http://localhost:3000) for the homepage or [localhost:3000/advisor](http://localhost:3000/advisor) for the planning workspace.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript types |
| `npm test` | Run unit and component tests |
| `npm run test:e2e` | Run browser tests against a running app |
| `npm run test:live` | Evaluate real advisor responses against a running app; uses the configured API key |

For browser tests, install Chrome through Playwright once, then run the tests while the app is running in another terminal:

```bash
npx playwright install chrome
npm run test:e2e
```

Browser tests use mocked advisor responses. Live evaluations make real provider requests and write generated results to `docs/evaluations/advisor-live-results.json`, which is ignored by Git.

## Project structure

```text
app/                   Pages, styles, and the advisor API route
components/            Homepage and advisor interface components
hooks/                 Chat and pinned-note hooks
lib/                   Advisor prompts, streaming, storage, and planning logic
types/                 Shared TypeScript types
public/                Static website assets
docs/images/           README screenshots
scripts/               Live advisor evaluation script
tests/                 Unit, component, browser, and evaluation cases
.github/workflows/     Automated checks on pushes and pull requests
```

## Deployment

The live site is hosted on Vercel. Import this GitHub repository as a Next.js project, use Node.js 24, and add `NVIDIA_API_KEY` in the project's server environment variables. Set `NVIDIA_MODEL` only if you want to override the default, then deploy.

For a local production run:

```bash
npm run build
npm run start
```

## What belongs on GitHub

Keep application source, public assets, tests, configuration, `package.json`, and `package-lock.json`. The lockfile makes installs reproducible.

`.gitignore` excludes dependencies, build caches, local environment files, deployment metadata, agent artifacts, logs, coverage, and generated test reports. Keep `.env.local` and API keys private.
