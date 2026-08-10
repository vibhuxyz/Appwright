# Devian

An AI app builder in the shape of Emergent/Lovable. You type *"build me a food delivery app"*;
a planner turns it into requirements, a frozen architecture, and a task list; a coding agent runs
those tasks in an isolated sandbox; you watch a live preview, review, iterate, and deploy.

**Status:** V0 — building the agent loop. See [`docs/README.md`](./docs/README.md).

## Quick start

```bash
bun install
bun run agent "add a dark mode toggle"   # the V0 harness
bun run dev:api                          # api on :3001
bun run dev:web                          # web on :5173
```

`bun run dev` brings the whole stack up in Docker (Postgres, Redis, api, web) — you don't need it
until V1.

## Layout

```
services/
  web/            React + Vite
  api/            Express — HTTP, auth, persistence, SSE. Imports the agent directly.
  orchestrator/   job state machine (V3)

libs/ts/
  agent-core/     the loop · Message/AgentEvent types · providers · CLI
  tools/          fs · bash · grep · git · the path fence
  contracts/      Zod schemas shared across services
  db/             Prisma + Postgres
  ui · config · eslint-config · typescript-config

templates/vite-react   the pristine starter copied into every generated project
docker/                one Dockerfile per service (build context is the repo root)
ref-ai/                read-only reference: 10 MIT packages, 142k lines. Never delete.
docs/                  architecture, versions, decisions, code quality, learning
```

**TypeScript end to end.** The agent is a library the API imports — no service boundary, no
codegen. Python returns at V5 only if a specific job needs it ([D13](./docs/DECISIONS.md)).

## Docs

| | |
|---|---|
| [docs/README.md](./docs/README.md) | **Start here** — status and index |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | The whole system, with diagrams |
| [docs/VERSIONS.md](./docs/VERSIONS.md) | V0 → V5, one acceptance test each |
| [docs/DECISIONS.md](./docs/DECISIONS.md) | Every decision, its trade-off, what's still open |
| [docs/CODE_QUALITY.md](./docs/CODE_QUALITY.md) | How to write code here — patterns from `ref-ai` |
| [docs/LEARNING.md](./docs/LEARNING.md) | What to learn at each version, and what's stuck |
| [CLAUDE.md](./CLAUDE.md) | How Claude works in this repo |

## Requirements

[Bun](https://bun.sh) 1.3+ · Docker (from V1)
