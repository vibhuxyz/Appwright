# Devian — docs

An AI app builder in the shape of Emergent/Lovable. One sentence in → a planner produces a frozen
architecture and a task list → a coding agent executes the tasks in an isolated sandbox → live
preview, review, iterate, deploy.

**Type `/start` to begin a session. Type `/wrap` to end one.** The docs are the memory.

---

## Status

**Now:** V0 — Slice 1. The agent loop.
**Next:** V1 — web app + persistence.

- [x] Architecture extracted from the *Coding Agents + Cloud* deck
- [x] V0–V5 ladder defined, each with one acceptance test
- [x] **TypeScript end to end** ([D4](./DECISIONS.md)) — the agent is a library, not a service
- [x] Repo restructured: `services/` + `libs/` + `docker/`, no task runner
- [x] Slice 0 — workspace scaffolded, `bun install` clean, API imports `@repo/agent-core`
- [ ] **Slice 1 — `Message`, `AgentEvent` (with `seq`), `AgentEventSink` in `libs/ts/agent-core/src/types.ts`**
- [ ] Slice 2–7 — provider, tools, loop, prompt, CLI, proof

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
V4  APP BUILDER          planner · blueprint · task DAG · generation            ◄ Emergent parity
V5  AUTONOMY & DEPLOY    self-heal · memory · observability · one-click deploy

Track B (parked)         bridge · device auth · handoff — "run it on my own machine"
```

Every version has **one** acceptance test. No partial credit. Never skip a rung.

---

## The files

| | |
|---|---|
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | The system. Diagrams, data model, every layer, where we deviate from the deck |
| **[VERSIONS.md](./VERSIONS.md)** | The ladder: ship criteria, estimates, sequencing rules |
| **[versions/](./versions/)** | The actual TODO list per version, with traps and definition of done |
| **[DECISIONS.md](./DECISIONS.md)** | 13 decisions with trade-offs, plus what's still open |
| **[CODE_QUALITY.md](./CODE_QUALITY.md)** | How we write code here — patterns from `ref-ai/packages`. Keep it open while coding |
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
- **`ref-ai/packages/`** — 10 MIT-licensed TypeScript packages, 142k lines, 438 test files. Read
  it; some of it you can install. Map in [CODE_QUALITY.md](./CODE_QUALITY.md). **Never delete it.**
