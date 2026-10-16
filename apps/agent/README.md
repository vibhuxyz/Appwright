# agent-worker

Polls Postgres for conversation jobs and runs them inside a sandbox
(`LocalSandboxProvider` or `E2BSandboxProvider` via `createSandboxProviderFromEnv`).

## Start (local V3)

```bash
# Infra
docker compose up -d postgres redis
cd packages/db && bunx --bun prisma migrate deploy && cd ../..

# In repo-root `.env`: EXECUTION_MODE=sandboxed, SANDBOX_PROVIDER=local (or e2b + E2B_API_KEY)
bun --filter agent-worker dev
```

API must also be running (`bun --filter api dev`) so `POST /conversation` can enqueue
jobs when `EXECUTION_MODE=sandboxed`.
