# 🚀 Deployment

### Ship the web app. Visitors bring their own key.

The supported product is `apps/web`. Out of the box you get the debate loop, Settings for API keys, and an in-memory store. No LLM keys in the environment.

## 🗺️ Explore

- [⚡ Vercel](#-vercel)
- [✅ What you get](#-what-you-get)
- [🔐 Keys](#-keys)
- [📚 Related](#-related)

## ⚡ Vercel

1. Import the GitHub repository
2. Set the root directory to `apps/web`, or let Vercel detect the pnpm workspace
3. If the default build misses the workspace, build from the repo root:

```bash
pnpm --filter @argumentor/web build
```

4. Deploy — open the app → **Settings** → paste a key → start a debate

## ✅ What you get

| | Default | Notes |
|---|---|---|
| 🌐 App | Next.js on Vercel | `apps/web` |
| 🔑 Models | Bring your own key | OpenRouter, Anthropic, or OpenAI in Settings |
| 🗄️ Data | In-memory | Sessions last for the life of the server process |
| 👤 Auth | Off | Local dev does not require Clerk |

Optional sign-in, Postgres, rate limits, and analytics live in [🏠 Self-hosting](self-hosting.md).

## 🔐 Keys

Leave server LLM keys unset. Public traffic should use Settings. Putting a provider key in the environment would bill your account for every visitor.

## 📚 Related

- [🧠 Architecture](architecture.md)
- [🏠 Self-hosting](self-hosting.md)
- [📄 Environment template](../.env.example)

<p align="center">
  <sub>⚔️ Argue better. Think sharper. Train with ArguMentor.</sub>
</p>
