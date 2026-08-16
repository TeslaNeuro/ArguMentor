# Contributing

Thanks for taking an interest in ArguMentor.

## Local development

Requirements: Node.js 24+ and pnpm 11.22+ (Corepack recommended).

```bash
corepack enable && corepack prepare pnpm@11.22.0 --activate
pnpm install
pnpm --filter @argumentor/web dev
```

Open http://localhost:3000, go to **Settings**, and paste an OpenRouter, Anthropic, or OpenAI key. Keys stay in the browser; do not commit them.

## Tests

```bash
pnpm test
pnpm typecheck
```

## Optional self-hosting

Forks that want sign-in or durable storage can set Clerk and `DATABASE_URL`. See [docs/self-hosting.md](docs/self-hosting.md). The default local path uses an in-memory store and does not require those services.

Do not enable a server-side LLM key on a public deployment. Visitors should bring their own key in Settings.
