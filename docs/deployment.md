# Deployment

## Vercel (web)

1. Push this monorepo to GitHub.
2. Create a Vercel project; set **Root Directory** to `apps/web`.
3. Enable pnpm; set install command to `cd ../.. && pnpm install` if needed, or use Vercel’s monorepo detection with `pnpm-workspace.yaml` at repo root.
4. Add environment variables from `.env.example`:
   - `CLERK_*` / `NEXT_PUBLIC_CLERK_*`
   - `DATABASE_URL` (Neon)
   - `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`
   - `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
   - `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`
   - `ARGUMENTOR_DEV_AUTH=false` in production
5. Build command: `cd ../.. && pnpm --filter @argumentor/web build` (or Turborepo `turbo run build --filter=@argumentor/web`).
6. After first deploy, run `pnpm db:generate && pnpm db:push` against Neon (locally or CI).

## Neon Postgres

1. Create a project in Neon.
2. Enable the `vector` extension (`CREATE EXTENSION IF NOT EXISTS vector;`).
3. Copy the pooled connection string into `DATABASE_URL`.
4. From repo root: `pnpm db:generate && pnpm db:push`.

Until `DATABASE_URL` is set, the app uses the in-memory repository (suitable for demos only).

## Observability

- **Sentry**: set DSN vars; Next.js configs in `apps/web/sentry.*.config.ts` initialize automatically when present.
- **PostHog**: set `NEXT_PUBLIC_POSTHOG_KEY`; client analytics initialize in `AppProviders`.
- **LLM traces**: development logging via `apps/web/src/lib/llm-trace.ts`; inspect with `GET /api/traces` in non-production.

## Upstash Redis (optional Phase 1.5)

Wire `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` for rate limits when you leave open demo mode.
