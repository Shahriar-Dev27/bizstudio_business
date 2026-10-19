# Advisor deployment

Deploy this Next.js app on Vercel. Set `NVIDIA_API_KEY` in the project's environment variables and redeploy. Locally, set it in `.env.local`.

`NVIDIA_MODEL` is optional; the default is `nvidia/nemotron-3-ultra-550b-a55b`.

The advisor streams directly through `/api/advisor/chat`. No Redis database, signed session cookie, background worker, or extra environment settings are needed.

Timeouts are built in: 45 seconds for initial model activity, 45 seconds between updates, and 180 seconds total. The Vercel route allows 300 seconds. These are separate application and hosting limits.

Drafts, saved plans, and pinned notes stay in browser storage. Stop cancels the stream; interrupted answers remain available to retry or continue. Private reasoning text is discarded on the server.

The simplified backend has no application-level request quotas or shared daily token limit.
