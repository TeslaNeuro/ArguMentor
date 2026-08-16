# 🏠 Self-hosting

### Optional sign-in, storage, and limits.

The default path needs none of this. Visitors add a model key in **Settings**. Use the variables below only if you want hosted auth, durable data, rate limits, or analytics.

Full template → [`.env.example`](../.env.example)

## 🗺️ Explore

- [⚙️ Environment](#-environment)
- [👤 Auth](#-auth)
- [🗄️ Postgres](#-postgres)
- [🛡️ Rate limits](#-rate-limits)
- [📊 Analytics](#-analytics)
- [📚 Related](#-related)

## ⚙️ Environment

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` · `CLERK_SECRET_KEY` | Hosted sign-in |
| `DATABASE_URL` | Postgres (Neon works well) |
| `UPSTASH_REDIS_REST_URL` · `UPSTASH_REDIS_REST_TOKEN` | Rate limits on AI routes |
| `SENTRY_DSN` · `NEXT_PUBLIC_SENTRY_DSN` | Error tracking |
| `NEXT_PUBLIC_POSTHOG_KEY` · `NEXT_PUBLIC_POSTHOG_HOST` | Product analytics |
| `ARGUMENTOR_DEV_AUTH` | Local self-host without Clerk — leave unset on a public deployment |

Do not set server-side LLM keys on a public deployment.

## 👤 Auth

Clerk is optional. Local development uses a built-in user when Clerk is unset.

Set `ARGUMENTOR_DEV_AUTH=true` only for a private self-host without Clerk. Never enable it on a public site.

## 🗄️ Postgres

When `DATABASE_URL` is set, the app uses Prisma instead of the in-memory store.

```bash
pnpm db:generate
pnpm db:push
```

Without it, sessions live in memory for the life of the server process.

## 🛡️ Rate limits

When Upstash REST credentials are set, create-debate and AI routes are limited per user. Without them, limits are skipped.

## 📊 Analytics

Sentry and PostHog are optional. Leave them blank if you do not want error or product telemetry.

## 📚 Related

- [🚀 Deployment](deployment.md)
- [🧠 Architecture](architecture.md)

<p align="center">
  <sub>⚔️ Argue better. Think sharper. Train with ArguMentor.</sub>
</p>
