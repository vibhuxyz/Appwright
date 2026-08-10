# Devian — Documentation

**What we're building:** an AI app builder in the shape of **Emergent / Lovable**. A user types
*"build me a food delivery app"*; a planner turns that into requirements, a frozen architecture,
and an ordered task list; a coding agent executes those tasks inside an isolated cloud sandbox;
the user watches a live preview, reviews, iterates, and deploys.

---

## Working with Claude on this

Type **`/start`** at the beginning of a session. It makes Claude read the docs below, show the
current task tracker, check the docs against the actual code, and pick up where you left off.
Type **`/wrap`** at the end — it writes the session note and updates the roadmap, decisions, and
learning log, so the next session has memory.

[`../CLAUDE.md`](../CLAUDE.md) loads automatically and holds the teaching contract (guided
learning, simple English, analogy first, don't write the code for me).

---

## Start here

| If you want to… | Read |
|---|---|
| Understand the whole system | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Know what to build next | [PROJECT_ROADMAP.md](./PROJECT_ROADMAP.md) → [VERSIONS.md](./VERSIONS.md) |
| Start coding right now | [versions/V0_AGENT_LOOP.md](./versions/V0_AGENT_LOOP.md) |
| **Write good code while coding** | **[CODE_QUALITY.md](./CODE_QUALITY.md)** — keep it open |
| Know why something is the way it is | [DECISIONS.md](./DECISIONS.md) |
| Know what to learn next | [LEARNING_PATH.md](./LEARNING_PATH.md) |
| Prepare to be interviewed on this | [INTERVIEW_PREP.md](./INTERVIEW_PREP.md) |

---

## The plan in ten lines

```
 V0  AGENT LOOP            while-not-if · tools · streaming · providers
 V1  WEB APP + MEMORY      Projects/Sessions/Messages · SSE · 3-pane UI · preview
 V2  ISOLATION & CONTROL   git worktrees · approvals · diffs · verification
 V3  CLOUD SANDBOX         queue · orchestrator · sandbox mgr · auth · multi-tenant   ◄ the wall
 V4  APP BUILDER           planner · blueprint · task DAG · generation               ◄ Emergent parity
 V5  AUTONOMY & DEPLOY     self-heal · memory · observability · one-click deploy

 Track B (parked)          bridge · device auth · handoff — "run it on my own machine"
```

Every version has **one acceptance test**. No partial credit.

---

## Every file

| File | What it holds |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | The full system. Diagrams for every layer, the data model, the end-to-end sequence, and where we deliberately deviate from the source deck |
| [VERSIONS.md](./VERSIONS.md) | The V0–V5 ladder: ship criteria, estimates, sequencing rules, and how this maps onto the older `ROADMAP.md` |
| [versions/V0_AGENT_LOOP.md](./versions/V0_AGENT_LOOP.md) | Rebuild the loop. Tools, providers, streaming, the CLI harness |
| [versions/V1_WEB_APP.md](./versions/V1_WEB_APP.md) | Postgres schema, REST + SSE, the 3-pane UI, live preview |
| [versions/V2_ISOLATION_AND_CONTROL.md](./versions/V2_ISOLATION_AND_CONTROL.md) | Worktrees, approvals, diff/merge, verification |
| [versions/V3_CLOUD_SANDBOX.md](./versions/V3_CLOUD_SANDBOX.md) | Sandbox port, queue, orchestrator, worker, auth, multi-tenancy |
| [versions/V4_APP_BUILDER.md](./versions/V4_APP_BUILDER.md) | Intent → blueprint → task DAG → generation → verification |
| [versions/V5_AUTONOMY_AND_DEPLOY.md](./versions/V5_AUTONOMY_AND_DEPLOY.md) | Observability, error classification, self-healing, deployment, memory |
| [CODE_QUALITY.md](./CODE_QUALITY.md) | 14 patterns pulled out of `ref-ai/packages`, each with its Python form — plus which ref-ai package to read at which version, and a pre-commit checklist |
| [DECISIONS.md](./DECISIONS.md) | Twelve decisions with trade-offs, plus seven still open |
| [LEARNING_PATH.md](./LEARNING_PATH.md) | Per-version concepts, "you know it when…" tests, and the traps at each level |
| [LEARNING_LOG.md](./LEARNING_LOG.md) | What has actually been mastered, and habits being built |
| [INTERVIEW_PREP.md](./INTERVIEW_PREP.md) | Per-version interview questions from this architecture, with what a strong answer sounds like |
| [PROJECT_ROADMAP.md](./PROJECT_ROADMAP.md) | Status board: current phase, current task, next up |
| [SESSION_01](./SESSION_01.md) · [02](./SESSION_02.md) · [03](./SESSION_03.md) | Session notes |

---

## Conventions

- **Every version ends in a demo, not a refactor.** If work doesn't change what you can show
  someone, it belongs inside another version.
- **Write the acceptance test first.** It is the definition of done.
- **Never optimise before feeling the limitation.** No queue until one process is visibly the
  bottleneck. No warm pool until cold starts visibly hurt.
- **Record trade-offs, not just choices.** A decision without a recorded cost is a preference.
  New decisions go in [DECISIONS.md](./DECISIONS.md); superseded ones stay, marked.
- **Keep docs matching the disk.** Re-audit at the end of every version — the previous roadmap
  drifted into describing code that had been deleted.

---

## Source material

- **`Coding agents + cloud`** (100xdevs) — the deck this architecture is extracted from: the tool
  loop, the schema, the routes, worktrees, approvals, the bridge, handoff.
- **`ref-ai/packages/`** — a complete TypeScript agent loop in this repo. The V0 reference. Port it,
  don't reinvent it.
- **[`../ROADMAP.md`](../ROADMAP.md)** — deep design reference for the frontend-builder / registry
  thinking. **Not** the schedule of record; [VERSIONS.md](./VERSIONS.md) is.
