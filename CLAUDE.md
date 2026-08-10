# CLAUDE.md

**Devian** — an AI app builder in the shape of Emergent/Lovable. One sentence in → a planner
produces a frozen architecture and a task list → a coding agent executes them in an isolated
sandbox → live preview, review, iterate, deploy.

---

## Starting a session

| I type | You do |
|---|---|
| **`/start`** | **The normal way to begin.** Read the docs, show the tracker, check for drift, ask one question |
| `/wrap` | End of session: write the session note, update the docs |
| *(nothing)* | Read `docs/README.md` first so you know which version we're in. Never guess status |

**Never ask me to paste a session summary.** `docs/` is the memory.

---

## How to work with me

**The mentor contract is in `~/.claude/CLAUDE.md`** — it loads automatically in every project.
Follow it; don't restate it. The three rules that matter most here:

1. **Guided learning is the default.** Explain → ask me to design → ask for pseudocode → review
   what I wrote. Full code only when I say **"just give it"**.
2. **Never decide for me** when two valid options exist. Give the trade-offs, make me choose and
   defend, then record it in `docs/DECISIONS.md` with what we gave up.
3. **The less you type and the more I think, the better you're doing.**

**Review, don't interview.** Save review mode for the end of a real milestone — then use
`docs/INTERVIEW_PREP.md` and push back on weak answers.

### ⚠️ Version numbers mean something different here

`~/.claude/CLAUDE.md` has a generic ladder (V0 prototype → V1 persistence → V2 clean architecture →
V3 production → V4 scaling). **Devian's don't line up:** V0 is the agent loop, V2 is worktrees and
approvals, V4 is the planner, V5 is autonomy. Source of truth: `docs/VERSIONS.md`.

The generic ladder's *principles* still hold: never skip a version, never add a technology without
answering *"what problem does it solve and why can't the previous version solve it"*, never
optimise before I've felt the limitation.

---

## The docs

| | |
|---|---|
| `docs/README.md` | **Start here.** Status + index |
| `docs/ARCHITECTURE.md` | The system: diagrams, data model, every layer |
| `docs/VERSIONS.md` + `docs/versions/` | The ladder, and the TODO list per version |
| `docs/DECISIONS.md` | What's locked, what's open, and every trade-off |
| `docs/CODE_QUALITY.md` | **How we write code.** Follow it; cite it when reviewing mine |
| `docs/LEARNING.md` | What to learn now, and what I've actually mastered |

**If a doc disagrees with the code, the code wins** — then fix the doc that session. This repo has
drifted twice.

---

## Locked decisions

Full reasoning in `docs/DECISIONS.md`. Don't reopen without a new fact.

- **TypeScript end to end** (D4). The agent is a **library** (`libs/ts/agent-core`), not a service —
  `services/api` imports it. Python returns at V5 only if a specific job needs it (D13).
- **No agent framework.** No LangChain. We call provider APIs directly. The loop is the product.
- **One type definition, shared by import** (D10). Zod in `agent-core/src/types.ts`. No codegen.
- **No task runner** (D11). `package.json` scripts + Docker Compose.
- **`services/` deploys, `libs/` gets imported** (D12).
- **Postgres + Prisma** (D5) — not SQLite, despite the source deck. Multi-tenant and hosted.
- **Cloud sandboxes from V3** (D6). LLM-written `bash` never runs on the API host.
- **Bridge deferred** (D7) — keep its invariants from V1: all state in the DB, every event has `seq`.
- **Session = git worktree = branch** (D8).
- **Deterministic engines over bigger prompts** (D9).

---

## Stack

TypeScript · Bun · Express · Vite + React · Prisma + Postgres · Docker Compose.
Use `bun` / `bunx`, never `npm` / `npx`. Bun auto-loads `.env`.

```bash
bun install
bun run agent "add a dark mode toggle"    # the V0 harness
bun run dev:api        bun run dev:web    # host-native, fast inner loop
bun run dev                                # docker compose up
bun run check-types    bun test    bun run lint
```

Don't "modernise" Express into `Bun.serve`, or Prisma into `bun:sqlite`. Not on any TODO list.

### Layout

```
services/
  web/            React + Vite. Still the starter; V1 replaces it.
  api/            Express. Owns HTTP, auth, DB, SSE. Imports the agent directly.
  orchestrator/   empty — V3 (job state machine).
libs/ts/
  agent-core/     THE LOOP. types.ts · loop.ts · providers/ · cli.ts    ← V0 builds this
  tools/          fs · bash · grep · git · fence                        ← V0 builds this
  contracts/      Zod schemas. projectFiles.ts is ✅ correct — import it, don't rewrite it
  db/             Prisma + Postgres. OLD schema shape — V1 Slice 1 rewrites it
  ui · config · eslint-config · typescript-config
templates/vite-react   the pristine starter the agent copies. Never edited in place.
docker/         one Dockerfile per service; build context is always the repo root
ref-ai/         READ-ONLY reference. 10 MIT packages, 142k lines. NEVER DELETE.
                Reading map in docs/CODE_QUALITY.md Part 1.
```

**Deleted — don't look for these:** `apps/`, `packages/`, `apps/opencode/`, `services/agent/`,
`libs/py/`, `Makefile`, `turbo.json`, `pyproject.toml`, root `ROADMAP.md`.

---

## Working agreements

- **Write the acceptance test first.** One per version. No partial credit.
- **Vertical slices** — one route + one UI element + one table, working end to end.
- **Every version ends in a demo, not a refactor.**
- Run `bun run check-types` before claiming something works. If it fails, say so with the output.
- Small commits. Never commit or push unless I ask.
- If you find a real problem with what I asked for, say it in a sentence — then keep going.
