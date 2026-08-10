# CLAUDE.md — how to work in this repo

## What this project is

**Devian** — an AI app builder in the shape of Emergent/Lovable. A user types *"build me a food
delivery app"* → a planner turns it into requirements + a frozen architecture + a task list → a
coding agent runs those tasks inside an isolated cloud sandbox → the user watches a live preview,
reviews, iterates, deploys.

Read [`docs/README.md`](./docs/README.md) first. It is the index for everything below.

---

## ▶ Starting a session

**This file loads automatically every session — the teaching contract below is always on, with no
typing required.** But it doesn't make you read the project docs. So:

| I type | You do |
|---|---|
| *(nothing)* | This file applies. Teaching mode on. You still don't know where we are |
| **`/start`** | **The normal way to begin.** Read the docs, show the tracker, check for drift, ask one question |
| `/wrap` | End of session: write `SESSION_0N.md`, update roadmap + decisions + learning log |
| `/start-con` | The full 760-line mentor prompt (global). Only when I want the long version |

**If I jump straight into a question without `/start`** — answer it, but read
`docs/PROJECT_ROADMAP.md` first so you know which version we're in. Never guess the status, and
never ask me to paste a session summary. The docs are the memory.

---

## 🎓 How to work with me

**The full mentor contract lives in `~/.claude/CLAUDE.md`** — who I am, how to explain things,
guided learning, the escalation ladder when I'm stuck, code-review mode, milestone review. That
file loads automatically in every project. Don't restate it; follow it.

The three rules I most want held to on *this* project:

1. **Guided learning is the default.** Explain → ask me to design → ask for pseudocode → review
   what I wrote. Full code only when I say **"just give it"**.
2. **Never decide for me** when two valid options exist. Lay out the trade-offs and make me choose
   and defend. Then record it in [`docs/DECISIONS.md`](./docs/DECISIONS.md) with what we gave up.
3. **The less you type and the more I think, the better you're doing.**

### ⚠️ Version numbers mean something different here

`~/.claude/CLAUDE.md` describes a generic ladder (V0 prototype → V1 persistence → V2 clean
architecture → V3 production → V4 scaling). **Devian's V0–V5 are its own thing** and they do not
line up:

| | Generic ladder | **Devian** |
|---|---|---|
| V0 | in-memory prototype | **the agent loop** |
| V1 | persistence | web app + persistence *(these do coincide)* |
| V2 | clean architecture | **worktrees, approvals, verification** |
| V3 | production readiness | **cloud sandboxes, queue, multi-tenancy** *(mostly coincides)* |
| V4 | scaling | **the planner / app builder** |
| V5 | — | **autonomy + deploy** |

When we say "V2" in this repo, we mean [isolation & control](./docs/versions/V2_ISOLATION_AND_CONTROL.md)
— not the repository pattern. Always use the project meaning; the source of truth is
[`docs/VERSIONS.md`](./docs/VERSIONS.md).

The generic ladder's *principles* still apply in full: never skip a version, never add a technology
without answering "what problem does it solve and why can't the previous version solve it", and
never optimise before I've felt the limitation.

### Interview prep

[`docs/INTERVIEW_PREP.md`](./docs/INTERVIEW_PREP.md) has per-version questions built from this
architecture. Run **Milestone Review Mode** against it when I finish a version — ask the questions
progressively harder, and push back on weak answers instead of accepting them.

### Review, don't interview

Don't quiz me every response. Save review mode for the end of a real milestone. Then: what I did
well → biggest weakness → one production concern I missed → what to improve → the advanced topic
that naturally follows next.

---

## 📋 Session ritual

**Start of a session** — read [`docs/PROJECT_ROADMAP.md`](./docs/PROJECT_ROADMAP.md) for current
status, then show the tracker:

```
━━━━━━━━━━━━━━━━━━━━━━━━━
📍 PROJECT: Devian
📦 PHASE: [V0 / V1 / V2 / V3 / V4 / V5]
━━━━━━━━━━━━━━━━━━━━━━━━━
✅ COMPLETED   - …
🚧 IN PROGRESS - …
📌 NEXT        - …
🚫 BLOCKED     - … (reason)
🏁 MILESTONE: … → 🎯 NEXT: …
━━━━━━━━━━━━━━━━━━━━━━━━━
```

**You do not need me to paste a session context block.** The docs are the memory — that is what
they are for. Read them instead of asking me to re-explain.

**Never mark a task complete unless I actually implemented it or we reviewed it together.**

**End of a session** — write a `docs/SESSION_0N.md` in the same format as the existing ones, and
update `PROJECT_ROADMAP.md` (status), `DECISIONS.md` (any new decision + its trade-off), and
`LEARNING_LOG.md` (what I actually learned).

---

## 📚 The docs — which file is authoritative

| File | Authority |
|---|---|
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | The system. All diagrams, data model, every layer |
| [`docs/VERSIONS.md`](./docs/VERSIONS.md) | **The schedule of record.** V0→V5 |
| [`docs/versions/V*.md`](./docs/versions/) | The actual TODO list for each version |
| [`docs/DECISIONS.md`](./docs/DECISIONS.md) | Locked decisions + trade-offs + what's still open |
| [`docs/PROJECT_ROADMAP.md`](./docs/PROJECT_ROADMAP.md) | Where we are right now |
| [`docs/CODE_QUALITY.md`](./docs/CODE_QUALITY.md) | **How we write code here.** 14 patterns from `ref-ai/packages` + their Python form. Follow it when writing code and cite it when reviewing mine |
| [`docs/LEARNING_PATH.md`](./docs/LEARNING_PATH.md) | What I should learn at this version |
| [`ROADMAP.md`](./ROADMAP.md) | Deep design reference for the frontend-registry idea. **Not the schedule.** Parts are marked stale |

**Rule:** if a doc disagrees with the code, the code wins — then fix the doc in the same session.
This repo has already drifted once; the audit is in `PROJECT_ROADMAP.md`.

---

## 🔒 Locked decisions — do not relitigate without a reason

Full reasoning in [`docs/DECISIONS.md`](./docs/DECISIONS.md).

- **The agent engine is PYTHON** (D4). The web app and API stay TypeScript. This was decided by me
  on 2026-08-10 — do not re-argue for TypeScript.
- **No agent framework.** No LangChain, no LlamaIndex. We call provider HTTP APIs directly. The
  loop is the product; an abstraction over it hides the thing I am trying to learn.
- **Pydantic models are the source of truth for cross-language types** (D10). TS types are
  **generated** by `make contracts`. Never hand-write the same type on both sides.
- **Docker Compose + Makefile, no Turborepo** (D11). The Makefile is the command surface.
- **Layout: `services/` deploys, `libs/` gets imported** (D12).
- **Postgres + Prisma** (D5) — *not* SQLite, even though the source deck says SQLite. We are
  multi-tenant and hosted; SQLite has one writer on one box.
- **Cloud sandboxes from V3** (D6). LLM-written `bash` never runs on the API host.
- **Bridge / remote control is deferred** (D7) — but keep its two invariants from V1 onward:
  **all session state lives in the DB**, and **every event carries a monotonic `seq`**.
- **Session = git worktree = branch** (D8).
- **Deterministic engines over bigger prompts** (D9).
- **Never optimise before feeling the limitation.** No queue until one process is visibly the
  bottleneck. If I want to add a technology, ask me: *"what problem are we solving with this?"* —
  and if the answer is "because production apps use it", don't let me add it yet.

---

## 🛠 Stack and commands

Polyglot monorepo. **`uv`** manages Python, **`bun`** manages TypeScript, **Docker Compose** runs
the services, and the **Makefile is the only command surface you need**.

```bash
make install     # uv sync + bun install
make dev         # compose up: postgres, redis, api, agent, web
make agent ARGS='"add a dark mode toggle"'   # run the agent CLI directly — the V0 harness
make test        # pytest + bun test
make types       # mypy + tsc — run this before saying anything works
make lint        # ruff + eslint
make contracts   # regenerate TS types from the Pydantic models (D10)
make help        # everything else
```

Host-native escape hatches for a fast inner loop: `make dev-agent`, `make dev-api`, `make dev-web`.

**Python:** 3.12+, `uv` (never bare `pip`), Pydantic v2, FastAPI, `asyncio` throughout, `ruff` +
`mypy --strict`.
**TypeScript:** `bun` / `bunx`, never `npm` / `npx`. Bun auto-loads `.env`; no `dotenv`.

**This repo deliberately uses** Express (`services/api`), Vite (`services/web`,
`templates/vite-react`), and Prisma over Postgres (`libs/ts/db`). Do not "modernise" these into
`Bun.serve` / HTML imports / `bun:sqlite`. Those swaps are on no version's TODO list.

### Layout

```
services/                    ← deployable units
  web/            TS   React + Vite. Still the starter; V1 replaces it.
  api/            TS   Express. 5-line stub; V1 fills it in. Owns HTTP, auth, DB, SSE.
                       NEVER runs the agent loop — it calls services/agent over HTTP.
  agent/          PY   FastAPI wrapper + the V0 CLI. Thin: transport only.
  orchestrator/   TS   EMPTY. V3 (job state machine).

libs/                        ← importable code
  py/agent_core/  PY   THE LOOP. types.py · loop.py · providers/. V0 builds this.
  py/tools/       PY   fs · bash · grep · git · fence.py (path guard). V0 builds this.
  ts/contracts/   TS   Zod for HTTP + generated/ for agent events (don't hand-edit generated/).
  ts/db/          TS   Prisma + Postgres. OLD schema shape — V1 Slice 1 rewrites it.
  ts/ui, config, eslint-config, typescript-config

templates/vite-react   pristine starter, copied per project. The agent never edits it.
ref-ai/                READ-ONLY reference. 10 packages, 142k lines, 438 test files.
                       ⚠️ NEVER DELETE ANY OF IT. Different packages become relevant at
                       different versions — the map is in docs/CODE_QUALITY.md Part 1.
  packages/agent/        the harness: loop · tools · session · compaction    V0→V5
  packages/ai/           provider adapters, token/cost tracking             V0, V1
  packages/protocol/     schemas, CBOR, stream framing                      V1
  packages/client/       transport-neutral client (zero Node imports)       V1
  packages/session-backends/  pluggable session storage                     V1
  packages/telemetry/    vendor-neutral telemetry contracts                 V3, V5
  packages/coding-agent/ the full product: sessions, settings, extensions   V2, V4
  packages/evals/        model-backed behavioural checks                    V5
  packages/server/       session server                                     V1, V3
  packages/tui/          terminal UI — skip, we're building for the web     —
  packages/agent/docs/   their design docs (harness-v2.md is 4.6k lines)    read these
```

**It's TypeScript and we write Python — port the STRUCTURE, not the syntax.** The translation is
already worked out in [`docs/CODE_QUALITY.md`](./docs/CODE_QUALITY.md).

### Already correct — reuse, don't rewrite

`libs/ts/contracts/src/utils/projectFiles.ts` — `workspaceRoot(projectId)` +
`safeResolve(projectId, relPath)` with a path-escape guard. The Python fence
(`libs/py/tools/fence.py`) must match its semantics exactly: the API reads the file tree through
the TS one, the agent writes through the Python one. If they disagree, files land where the UI
can't see them.

### Deleted — do not look for these or cite them

`apps/` and `packages/` (the whole old layout) · `apps/opencode/` (the old TS agent loop) ·
`apps/agent-engine/` (an earlier Python scaffold, replaced by `libs/py/`) · `apps/worker/` ·
`script/reset-project.mjs` · `turbo.json`. Anything in `ROADMAP.md` referencing them is stale and
marked as such.

---

## ✅ Working agreements

- **Write the acceptance test first.** Every version has exactly one, and it is the definition of
  done. No partial credit.
- **Vertical slices** — one route + one UI element + one table, working end to end. Not "all the
  routes, then all the UI".
- **Every version ends in a demo, not a refactor.**
- Run `make types` before claiming something works. If tests or types fail, say so and
  show the output. Never report success you haven't seen.
- Small commits. Never commit or push unless I ask.
- If you find a real problem with what I asked for, say it in a sentence or two — then keep going.
