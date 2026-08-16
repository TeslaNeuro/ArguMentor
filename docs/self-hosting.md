# Self-hosting

The supported product is the web app. Visitors add their own model key in Settings. You do not need to put LLM keys in environment variables.

## Vercel

1. Import the GitHub repository.
2. Set the root directory to `apps/web` (or let Vercel detect the pnpm workspace).
3. Build with `pnpm --filter @argumentor/web build` from the repo root if the default does not.
4. Optional environment variables (see `.env.example`):
   - Clerk, if you want hosted sign-in
   - `DATABASE_URL` for Postgres (Neon works well)
   - Sentry / PostHog, if you want error and product analytics
   - Upstash Redis, if you want rate limits on AI routes

Leave server LLM keys unset. Public traffic should use Settings (bring your own key).

## Postgres

If you set `DATABASE_URL`, run `pnpm db:generate` and `pnpm db:push` against that database. Without it, sessions live in memory for the life of the server process.

## Rate limits

When Upstash REST credentials are set, create-debate and AI routes are limited per user. Without them, limits are skipped.
