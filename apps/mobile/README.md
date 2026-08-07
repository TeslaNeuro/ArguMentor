# Mobile (Expo)

Phase 2 shell that shares `@argumentor/debate-core` with the web app.

```bash
export PATH="$PWD/.tools/node_modules/.bin:$PATH"
pnpm install
pnpm --filter @argumentor/mobile dev
```

Point `app.json` → `extra.apiBaseUrl` at your deployed or local Next.js API.
