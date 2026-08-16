# How ArguMentor works

The web app runs a debate loop: create a session, stream an opponent turn, store the user’s reply with analysis, then judge and coach when the round ends.

## Pieces

- **Web app** (`apps/web`): UI and API routes
- **Debate core** (`packages/debate-core`): session state machine, schemas, prompts
- **Agents** (`packages/agents`): opponent, judge, analysis, coach, research
- **Data** (`packages/db`): in-memory store by default; Postgres via Prisma when `DATABASE_URL` is set

Agents do not call each other. The API decides when each one runs.

## Bring your own key

Model calls use the API key the visitor saves in Settings. The browser sends it on AI requests; the server uses it for that request only and does not store it.

## Debate lifecycle

1. `POST /api/debates` creates a session
2. The debate room calls `POST /api/debates/:id/opponent` (streamed text)
3. `POST /api/debates/:id/turn` stores the user turn and analysis
4. On the final round or `POST /api/debates/:id/end`, judge and coach run, then skill and memory records update
