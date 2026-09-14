# Appwright — project rules

> Tool-neutral. `CLAUDE.md` symlinks here. Personal working style lives in `~/.claude/CLAUDE.md`;
> this file is only what is true **about this repo**.

An AI app builder in the shape of Emergent/Lovable. One sentence in → a planner freezes an
architecture and emits a task DAG → an agent executes the tasks in an isolated sandbox → live
preview, review, iterate, deploy.

**The docs are the memory. Never ask for a pasted session summary.**

---

## Read before working

|                            |                                                                           |
| -------------------------- | ------------------------------------------------------------------------- |
| `docs/README.md`           | **Start here.** Current version, current slice, and the known-broken list |
| `docs/versions/V*.md`      | Only the current version. **Its checkboxes are the progress record**      |
| `docs/DECISIONS.md`        | 53 entries. What is locked (don't reopen) and what is open (may block)    |
| `docs/SESSION_PROTOCOL.md` | The `/start` and `/wrap` rituals, tool-neutral                            |
| `docs/CRASH_COURSE.md`     | Every concept explained so far, six lines each                            |
| `docs/ARCHITECTURE.md`     | Only when the task touches a layer you're unsure about                    |

---

## ⚠️ Version numbers here are project-specific

**V0–V6 in this repo are not the generic V0–V4 ladder in the global `CLAUDE.md`.** Use these:

```
V0  AGENT LOOP           while-not-if · tools · runtime seam · the path fence
V1  WEB APP + MEMORY     Postgres · SSE · seq · 3-pane UI · preview
V1.1 UI SYSTEM           shadcn · Radix · Lucide · tokens · component registry
V2  ISOLATION & CONTROL  git worktrees · approvals · diffs · verify tier 1
V3  CLOUD SANDBOX        queue · orchestrator · sandbox mgr · auth       ◄ the wall
V4  APP BUILDER          planner · blueprint · task DAG · full-stack gen ◄ Emergent parity
                         + UI system · design tokens · UI blueprint
V4.5 VISUAL EDITOR       component graph · property panel · ChangeSet   ◄ the differentiator
V5  BROWSER AGENT        drive the app · semantic clicks · verify 3 + 4
V6  AUTONOMY & DEPLOY    self-heal · memory · observability · deploy
```

Every version has **one** acceptance test. No partial credit. Never skip a rung.

---

## How to teach here — crash course, not lecture

A new concept mid-work gets a **six-line card**, then straight back to the task:

```
What        one plain sentence, no jargon
Why         what hurt before this existed
Like        one analogy from daily life, never from other software
Here        where it shows up in Appwright specifically
Costs       the trade-off
Go deeper   the version where this stops being enough
```

Write it into `docs/CRASH_COURSE.md` **immediately**, not at wrap — by then the wording is gone.

**Full depth is earned, not default.** Use the long 7-step explanation only when the current version
is _actually about_ that concept, or when asked. Never stack two or three explanations before
writing a line of code.

---

## Hard rules

- **If a doc disagrees with the code, the code wins** — then fix the doc that session. This repo has
  drifted twice; the "Known broken" table in `docs/README.md` is the scar.
- **Write the acceptance test first.** It is the definition of done and it stops scope creep.
- **Record trade-offs, not just choices.** A decision without a recorded cost is a preference.
- **Never optimise before feeling the limitation.** No queue until one process is visibly the
  bottleneck. No warm pool until cold starts visibly hurt.
- **Every version ends in a demo, not a refactor.**
- **Don't commit unless asked.**

## Never

- **Delete `ref-ai/`** — read-only reference. 10 MIT TypeScript packages, 252k lines. The loop is at
  `ref-ai/packages/agent/src/agent-loop.ts`.
- **Import `node:fs` or `node:child_process` in `packages/agent-core`** — tools go through the
  `Runtime` seam ([D27](docs/DECISIONS.md)). A leak here turns V3 into a rewrite.
- **Put a secret in an LLM prompt.** `DATABASE_URL` and `AUTH_SECRET` are generated at provision
  time and injected as env vars. The path fence denies `.env` explicitly ([D15](docs/DECISIONS.md)).
- **Let `edit_file` be fuzzy.** Exact match, or throw. That strictness is a data-loss guardrail at
  V4 ([D16](docs/DECISIONS.md)).

---

## Commands

Turborepo since [D54](docs/DECISIONS.md) (reverses [D11](docs/DECISIONS.md)) — `package.json`
scripts are still the surface, now delegating to `turbo run <task>` for `build`/`dev`/`check-types`/`lint`.
Docker Compose runs the stateful stack (Postgres, Redis; Kafka + workers behind `--profile events`).

```bash
bun install
bun run agent "…"        # the V0 harness
bun run dev:api          # :3001
bun run dev:web          # :3000
bun run dev              # turbo run dev — apps/api + apps/web, host-native
docker compose up        # Postgres, Redis, api, web — add `--profile events` for Kafka + workers
bun run check-types      bun run test      bun run lint
```

**Known broken, verified 2026-08-11:** `bun test` has no `bunfig.toml`, so it walks `ref-ai`'s 438
tests and hangs. `bun run check-types` covers 14 of 20 workspace members. See `docs/README.md`.

---

## Layout

```
apps/            web · api · orchestrator          things that run as a process
packages/        agent-core · auth · cache · config · contracts · db · events ·
                  logger · tools · ui-system · eslint-config · typescript-config
workers/         ingestion · indexing · evaluation · maintenance   D56, `--profile events`
infrastructure/  docker · compose · k8s (reserved) · terraform (reserved)
templates/       vite-react · nextjs-fullstack (V4)   pristine starters the agent copies
ref-ai/          read-only reference — never delete
docs/            the plan, and the memory
```

**Renamed from `services/` + `libs/ts/` + `docker/` on 2026-09-15** — see
[D54](docs/DECISIONS.md) for why (reverses [D11](docs/DECISIONS.md), [D12](docs/DECISIONS.md), a
user-directed call, not an earned one). If a stale doc still says `services/` or `libs/ts/`, the
new tree above wins per the "code wins" rule.

**TypeScript end to end** ([D4](docs/DECISIONS.md)). The agent is a library the API imports — no
service boundary, no codegen. `apps/orchestrator` is still the empty stub V3 fills in, for
**isolation**, which is a real reason.
