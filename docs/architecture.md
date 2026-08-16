# 🧠 Architecture

### How ArguMentor runs a debate.

The web app owns the loop. It creates a session, streams the opponent, stores the user’s reply with analysis, then judges and coaches when the round ends.

Agents never call each other. API routes decide when each one runs.

## 🗺️ Explore

- [🔄 Debate loop](#-debate-loop)
- [🧱 Packages](#-packages)
- [🔑 Bring your own key](#-bring-your-own-key)
- [📡 Lifecycle](#-lifecycle)
- [📚 Related](#-related)

## 🔄 Debate loop

**🗣️ Debate → 🔬 Analyze → ⚖️ Judge → 🎓 Coach**

| Step | What happens |
|---|---|
| 🥊 Opponent | Streams a rebuttal for the current round |
| 🔬 Analysis | Extracts claims, evidence, assumptions, and weak points |
| ⚖️ Judge | Scores clarity, evidence, logic, and persuasiveness |
| 🎓 Coach | Turns the scorecard into drills and a training plan |
| 🧩 Memory | Updates skill profile across sessions |

## 🧱 Packages

| | Package | Role |
|---|---|---|
| 🌐 | `apps/web` | UI and API routes |
| 🧠 | `packages/debate-core` | Session state machine, schemas, prompts |
| 🤖 | `packages/agents` | Opponent · Judge · Analysis · Coach · Research |
| 🗄️ | `packages/db` | In-memory by default · Postgres via Prisma when `DATABASE_URL` is set |
| 🎨 | `packages/ui` | Shared design tokens |
| ⚙️ | `packages/config` | Shared TypeScript config |

## 🔑 Bring your own key

Model calls use the key the visitor saves in **Settings**.

The browser sends it on AI requests. The server uses it for that request only and does not store it. Do not put provider keys in environment variables on a public deployment.

## 📡 Lifecycle

1. `POST /api/debates` creates a session
2. The debate room streams `POST /api/debates/:id/opponent`
3. `POST /api/debates/:id/turn` stores the user turn and analysis
4. On the final round or `POST /api/debates/:id/end`, judge and coach run, then skill and memory records update

Research briefs use `POST /api/research` before a session starts. They are optional and sit outside the debate loop.

## 📚 Related

- [🚀 Deployment](deployment.md)
- [🏠 Self-hosting](self-hosting.md)

<p align="center">
  <sub>⚔️ Argue better. Think sharper. Train with ArguMentor.</sub>
</p>
