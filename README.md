# Devian

An AI app builder in the shape of Emergent/Lovable. You type *"build me a food delivery app"*;
a planner turns it into requirements, a frozen architecture, and a task list; a coding agent runs
those tasks in an isolated sandbox; you watch a live preview, review, iterate, and deploy.

**Status:** V0 — building the agent loop. See [`docs/PROJECT_ROADMAP.md`](./docs/PROJECT_ROADMAP.md).

## Quick start

```bash
make install     # uv sync (Python) + bun install (TypeScript)
make dev         # docker compose: postgres, redis, api, agent, web
make help        # every other command
```

Run the agent on its own — no containers needed:

```bash
make agent ARGS='"add a dark mode toggle to the header"'
```

## Layout

```
services/          deployable units
  web/       TS    React + Vite
  api/       TS    Express — HTTP, auth, persistence, SSE. Never runs the agent loop.
  agent/     PY    FastAPI + the V0 CLI. Thin wrapper around the loop.
  orchestrator/ TS job state machine (V3)

libs/              importable code
  py/agent_core/   the loop, Message/AgentEvent types, provider adapters
  py/tools/        fs · bash · grep · git · the path fence
  ts/contracts/    Zod for HTTP + generated types for agent events
  ts/db/           Prisma + Postgres
  ts/ui, config, eslint-config, typescript-config

templates/vite-react   the pristine starter copied into every generated project
ref-ai/packages        READ-ONLY reference — 10 packages, 142k lines, 438 test files.
                       Never delete it. Reading map: docs/CODE_QUALITY.md Part 1.
docs/                  architecture, version plan, decisions, code quality, learning path
```

**Python owns the agent; TypeScript owns the web and API.** Types cross the boundary as generated
code — Pydantic models are the source of truth, `make contracts` regenerates the TypeScript.

## Docs

| | |
|---|---|
| [docs/README.md](./docs/README.md) | index — start here |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | the whole system, with diagrams |
| [docs/VERSIONS.md](./docs/VERSIONS.md) | V0 → V5, with an acceptance test each |
| [docs/CODE_QUALITY.md](./docs/CODE_QUALITY.md) | how to write good code here — patterns from `ref-ai`, in Python |
| [docs/DECISIONS.md](./docs/DECISIONS.md) | every decision, its trade-off, and what's still open |
| [docs/LEARNING_PATH.md](./docs/LEARNING_PATH.md) | what to learn at each version |
| [docs/INTERVIEW_PREP.md](./docs/INTERVIEW_PREP.md) | interview questions built from this architecture |
| [CLAUDE.md](./CLAUDE.md) | how Claude should work in this repo |

## Requirements

Python 3.12+ · [uv](https://docs.astral.sh/uv/) · [Bun](https://bun.sh) 1.3+ · Docker
