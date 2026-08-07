# ⚔️ ArguMentor

### Train against an elite AI debate partner.

<p align="center">
  <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-3ecf8e?style=for-the-badge" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img alt="pnpm" src="https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white" />
</p>

ArguMentor is an open-source **debate training platform**. Pick a topic, argue turn-by-turn with an adaptive opponent, get judged with structured feedback, and improve over time with coaching and research tools.

> 🧠 Not a chatbot wrapper — a full practice loop:
>
> **🗣️ Debate → ⚖️ Evaluate → 📈 Learn**

---

## 🗺️ Explore

- [✨ Features](#-features)
- [🚀 Quick start](#-quick-start)
- [🔑 Add an LLM key](#-add-an-llm-key-recommended)
- [📁 Project structure](#-project-structure)
- [🧰 Stack](#-stack)
- [📜 Scripts](#-scripts)
- [⚙️ Configuration](#️-configuration-cheat-sheet)
- [🧭 Roadmap](#-roadmap)
- [🤝 Contributing](#-contributing)
- [👤 Author](#-author)
- [📄 License](#-license)

---

## ✨ Features

| | Feature | What you get |
|---|---|---|
| 🥊 | **AI Debate Opponent** | Topic, side, difficulty, personality, format & rounds — streaming rebuttals |
| ⚖️ | **Judge Scorecard** | Clarity, evidence, logic, persuasiveness + teachable mistake notes |
| 🔬 | **Turn Analysis** | Claims, evidence, assumptions & weakness hints after every turn |
| 🎓 | **Personal Coach** | Training plans and drills from your latest evaluation |
| 📚 | **Research Assistant** | Evidence briefs & viewpoint lenses before you hit the floor |
| 🧩 | **Skill Memory** | Progress across sessions (local memory · Postgres-ready) |
| 🎙️ | **Optional Voice** | Push-to-talk + TTS for opponent turns — toggleable in the UI |

---

## 🚀 Quick start

**Requirements:** Node.js **22+** (required by pnpm 11) · [pnpm](https://pnpm.io) **11.20+** (Corepack recommended)

```bash
git clone https://github.com/YOUR_USERNAME/ArguMentor.git
cd ArguMentor

corepack enable && corepack prepare pnpm@11.20.0 --activate

pnpm install
cp .env.example apps/web/.env.local
pnpm --filter @argumentor/web dev
```

🌐 Open **[http://localhost:3000](http://localhost:3000)** and start a debate.

💡 Dev auth is on by default (`ARGUMENTOR_DEV_AUTH=true`), so you can explore without setting up Clerk.

### 🔑 Add an LLM key (recommended)

Without a key, the app still runs in **demo mode**. For a real opponent and richer judging, use [OpenRouter](https://openrouter.ai/keys) (one key → many models):

```bash
# apps/web/.env.local
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=anthropic/claude-sonnet-4
OPENROUTER_ANALYSIS_MODEL=anthropic/claude-3.5-haiku
```

♻️ Restart the dev server after editing env vars.

You can also use `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` directly if you prefer.

---

## 📁 Project structure

```text
ArguMentor/
├── 🌐 apps/web              Next.js web app (primary product)
├── 📱 apps/mobile           Expo shell (early native scaffold)
├── 🧠 packages/debate-core  Debate state machine, schemas, prompts
├── 🤖 packages/agents       Opponent · Judge · Analysis · Coach · Research
├── 🗄️ packages/db           Prisma schema (Neon/Postgres) + local memory store
├── 🎨 packages/ui           Shared design tokens
└── ⚙️ packages/config       Shared TypeScript config
```

---

## 🧰 Stack

| Layer | Choice |
|---|---|
| 📦 Monorepo | Turborepo + pnpm |
| 🌐 Web | Next.js 16 App Router · TypeScript 7 |
| 🔐 Auth | Clerk (optional · local dev auth included) |
| 🤖 AI | Vercel AI SDK + OpenRouter / Anthropic / OpenAI |
| 🗄️ Data | Neon Postgres + Prisma (optional · in-memory fallback) |
| 🚀 Deploy | Vercel-ready (`apps/web`) |
| 📦 Tooling | Turborepo 2.10 · pnpm 11 |

📖 Deeper docs: [architecture](docs/architecture.md) · [deployment](docs/deployment.md)

---

## 📜 Scripts

| Command | What it does |
|---|---|
| `pnpm --filter @argumentor/web dev` | 🟢 Run the web app |
| `pnpm test` | ✅ Run package tests |
| `pnpm build` | 🏗️ Production build |
| `pnpm db:generate` | 🧬 Generate Prisma client |
| `pnpm db:push` | 📤 Push schema to Postgres |

---

## ⚙️ Configuration cheat sheet

| Variable | Purpose |
|---|---|
| 🔑 `OPENROUTER_API_KEY` | Preferred LLM gateway |
| 🟣 `ANTHROPIC_API_KEY` / 🟢 `OPENAI_API_KEY` | Direct providers (if OpenRouter unset) |
| 🧪 `ARGUMENTOR_DEV_AUTH` | `true` skips Clerk for local use |
| 👤 `CLERK_*` | Production auth |
| 🗄️ `DATABASE_URL` | Neon / Postgres (optional locally) |
| 📊 `NEXT_PUBLIC_POSTHOG_*` / 🛰️ `SENTRY_DSN` | Observability (optional) |

Full template → [`.env.example`](.env.example)

---

## 🧭 Roadmap

- [x] 🥊 Debate sessions, streaming opponent, judge scorecard
- [x] 🔬 Analysis, coach plans, research briefs, voice toggle
- [ ] 🧩 Deeper long-term memory (pgvector retrieval)
- [ ] 📱 Native mobile debate UI (Expo)
- [ ] 👥 Multiplayer / human-vs-human with AI judge
- [ ] 🛡️ Production hardening (rate limits, workers, cost controls)

---

## 👤 Author

**Arshia Keshvari**

Built for people who want to argue better — not just louder.

---

## 📄 License

Released under the [MIT License](LICENSE) — free to use, fork, and build on.

<p align="center">
  <sub>⚔️ Argue better. Think sharper. Train with ArguMentor.</sub>
</p>
