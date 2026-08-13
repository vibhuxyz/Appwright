# Appwright — docs

An AI app builder in the shape of Emergent/Lovable. One sentence in → a planner produces a frozen
architecture and a task list → a coding agent executes the tasks in an isolated sandbox → live
preview, review, iterate, deploy.

**Type `/start` to begin a session. Type `/wrap` to end one.** The docs are the memory.

---

## Status

**Now:** V0 — Slice 1. The agent loop.
**Next:** V1 — web app + persistence.

- [x] Architecture extracted from the *Coding Agents + Cloud* deck
- [x] V0–V6 ladder defined, each with one acceptance test
- [x] **TypeScript end to end** ([D4](./DECISIONS.md)) — the agent is a library, not a service
- [x] Repo restructured: `services/` + `libs/` + `docker/`, no task runner
- [x] Slice 0 — workspace scaffolded, `bun install` clean, API imports `@repo/agent-core`
- [x] **D22–D24 added** — HTTP sandbox contract · untrusted tool results · dependency allowlist
- [x] **D25 — E2B is the sandbox provider**, closing O1. Firecracker considered, deferred, with
      two written triggers that would reopen it
- [x] **D26–D29 added 2026-08-11** — six loop exits + a loop budget · the agent is a *client* of a
      runtime, not a resident · `/workspace` is the only root · the environment is prepared before
      the agent starts. **Four of them land in `types.ts` and `runtime.ts` — V0, not later.**
      Rejected the same day: an agent-swapping abstraction and a multi-language runtime matrix,
      both premature before one loop exists
- [x] **D30–D34 added 2026-08-13** — task ownership declares the graph · capability-not-model-name ·
      risk as its own axis with verification *floors* · state in Postgres, context assembled not
      generated · Architecture Change Requests, **closing O6**. V4's build order revised so
      scheduling and routing come last, behind the telemetry that makes them falsifiable.
      Rejected the same day: a `.project/` state directory, an LLM context synthesiser, a
      parallel-write integrator, and five-dimensional priority scoring
- [x] **D35–D40 added 2026-08-13** — plan vs execution (`Run` · `Task` · `TaskAttempt`) · five
      dispatch gates and **Orchestrator ≠ Scheduler** · normalised ownership over files *and*
      resources, **closing O9** · nested budgets user→run→task, which finally gives cost control a
      home · plan validation as a gate that never LLM-repairs · `RunEvent` as the execution log,
      distinct from `Message`. **`ARCHITECTURE.md` §11 had no `Blueprint` table at all** — the data
      model is now the eleven entities V4 actually needs. Deferred: a generic `Artifact` table (O11)
- [ ] **Slice 1 — `Message`, `AgentEvent` (with `seq`), `AgentEventSink` in `libs/ts/agent-core/src/types.ts`**
- [ ] Slice 2–7 — provider, tools, loop, prompt, CLI, proof

> ⚠️ **The honest number, re-counted 2026-08-13: 6,362 lines of docs, 316 lines of TypeScript** —
> and `agent-core/src/types.ts` is still **0 bytes**. The architecture is not the risk; that ratio
> is, and it got worse this session, not better. Slice 1 is one file. Write it.

### Known broken — verified against the code 2026-08-11

Not "todo". These are things the docs claimed were working and are not.

| What | Where | Fix in |
|---|---|---|
| `safeResolve` / `workspaceRoot` are **not exported** — three docs said "import it, don't rewrite it" | `libs/ts/contracts/src/utils/projectFiles.ts` | V0 Slice 3 |
| The fence root points at `libs/apps/projects` — `apps/` was deleted 2026-08-10 | same file | V0 Slice 3 |
| `bun test` walks `ref-ai/`'s 438 tests and hangs; **zero** project tests exist | no `bunfig.toml` | V0 Slice 3 |
| `bun run check-types` covers 4 of 11 packages — `contracts`, `db`, `config`, `web`, `orchestrator` have no script | `package.json` × 5 | V0 Slice 7 |
| `services/web` is a 255-line UI from the deleted architecture, wired to `:4000`; nothing listens there | `services/web/src/App.tsx` | V1 — delete, don't extend |

**Rule that caused all of this:** *"if a doc disagrees with the code, the code wins — then fix the
doc that session."* It was written after the first two drifts and not applied. Re-run the audit at
every `/wrap`: open the files the docs name and check they say what the docs claim.

**Exit criterion for V0:** `bun run agent "read package.json, then add a clean script to it"`
produces **two chained tool calls in one turn, with no human input between them.**

Detail: [versions/V0_AGENT_LOOP.md](./versions/V0_AGENT_LOOP.md)

---

## The plan

```
 V0  AGENT LOOP           while-not-if · tools · streaming · providers
 V1  WEB APP + MEMORY     Projects/Sessions/Messages · SSE · 3-pane UI · preview
 V2  ISOLATION & CONTROL  git worktrees · approvals · diffs · verification
 V3  CLOUD SANDBOX        queue · orchestrator · sandbox · auth · multi-tenant   ◄ the wall
 V4  APP BUILDER          planner · blueprint · task DAG · full-stack generation ◄ Emergent parity
 V5  BROWSER AGENT        drive the app · semantic clicks · E2E tests · visual checks
 V6  AUTONOMY & DEPLOY    self-heal · memory · observability · one-click deploy

 Track B (parked)         bridge · device auth — "run against MY machine's private repo"
```

Every version has **one** acceptance test. No partial credit. Never skip a rung.

---

## The files

| | |
|---|---|
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | The system. Diagrams, data model, every layer, where we deviate from the deck |
| **[VERSIONS.md](./VERSIONS.md)** | The ladder: ship criteria, estimates, sequencing rules |
| **[versions/](./versions/)** | The actual TODO list per version, with traps and definition of done |
| **[DECISIONS.md](./DECISIONS.md)** | 40 decisions with trade-offs, plus what's still open |
| **[CODE_QUALITY.md](./CODE_QUALITY.md)** | How we write code here — patterns from `ref-ai/packages`. Keep it open while coding |
| **[CRASH_COURSE.md](./CRASH_COURSE.md)** | Every concept explained so far, six lines each, dated. Written the moment it's taught |
| **[LEARNING.md](./LEARNING.md)** | What to learn at each version, and what's actually been mastered |
| **[INTERVIEW_PREP.md](./INTERVIEW_PREP.md)** | Questions built from this architecture |
| **[sessions/](./sessions/)** | Session notes |

---

## Rules

- **Write the acceptance test first.** It's the definition of done.
- **Every version ends in a demo, not a refactor.**
- **Never optimise before feeling the limitation.** No queue until one process is visibly the
  bottleneck. No multi-stage Docker build until push times annoy you.
- **Record trade-offs, not just choices.** A decision without a recorded cost is a preference.
- **If a doc disagrees with the code, the code wins** — then fix the doc that session. This repo has
  drifted twice.

---

## Source material

- **`Coding agents + cloud`** (100xdevs) — the deck: the tool loop, the schema, the routes,
  worktrees, approvals, the bridge, handoff.
- **`ref-ai/packages/`** — 10 MIT-licensed TypeScript packages, **252k lines** (119k source, 109k
  across 438 test files). The loop is at `ref-ai/packages/agent/src/agent-loop.ts`. Read it; some
  of it you can install. Map in [CODE_QUALITY.md](./CODE_QUALITY.md). **Never delete it.**
