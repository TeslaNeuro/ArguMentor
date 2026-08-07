# Architecture notes

See the Phase 0 plan for the full decision record. This document maps the implemented code.

## Runtime topology (Phase 1)

- **Client**: `apps/web` Next.js App Router (PWA-capable)
- **API**: Route Handlers under `apps/web/src/app/api`
- **Orchestrator**: `packages/debate-core` finite-state machine
- **Agents**: `packages/agents` (Opponent stream, Judge, Analysis, Coach, Research)
- **Persistence**: `packages/db` Prisma schema for Neon + in-memory store used when `DATABASE_URL` is unset

## Debate turn lifecycle

1. `POST /api/debates` creates session
2. Debate room loads → `POST /api/debates/:id/opponent` streams opponent turn
3. `POST /api/debates/:id/turn` stores user turn + analysis; advances state
4. On final round or `POST .../end` → Judge + Coach + skill/memory updates

## Multi-agent contracts

Agents share Zod schemas from `@argumentor/debate-core`. The orchestrator decides *when* agents run; agents never chat with each other in Phase 1.

## Phase 2+ already scaffolded

- Analysis engine on every user turn
- Coach plans persisted after evaluation
- Memory items for summaries/weaknesses/research
- Voice: Web Speech push-to-talk + speechSynthesis TTS
- Research API + UI
- Expo app shell in `apps/mobile`
