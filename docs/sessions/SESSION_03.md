# Session 03
**Date:** 2026-08-10
**Goal of the Session:** Absorb the *Coding Agents + Cloud* deck, decide the product shape
(Emergent/Lovable-style app builder), and turn it into a real plan: architecture, versions,
per-version TODOs, and a learning curve.

## What We Built / Explored
- Read the 48-slide *Coding agents + cloud* deck (100xdevs) end to end and extracted its
  architecture: the tool-call loop, the Projects/Session/Messages schema, the route surface,
  the `/conversation` streaming flow, git worktrees, approvals, the Bridge, and handoff.
- Extended it with the **cloud-agent** architecture (queue → orchestrator → sandbox manager →
  per-project sandboxes) and the **App Builder / Planner** layer that sits above it.
- **Audited the repo against the docs** and found the docs were describing a system that is no
  longer on disk: `apps/opencode/` (the working TS agent loop) is deleted, `services/orchestrator`
  and `services/agent` are empty files, `services/api` is a 5-line stub, `services/web` is the Vite
  starter. The effective position is near-greenfield.
- Wrote the documentation set: [ARCHITECTURE.md](../ARCHITECTURE.md), [VERSIONS.md](../VERSIONS.md),
  [versions/V0–V5](../versions/), [LEARNING_PATH.md](../LEARNING.md); rewrote
  [DECISIONS.md](../DECISIONS.md), [PROJECT_ROADMAP.md](../README.md), and
  [LEARNING.md](../LEARNING.md).

## What I Implemented Myself
- Supplied the deck and the cloud/planner extension, and set the product direction:
  **build something like Emergent.**

## New Concepts Learned
Full list in [LEARNING.md](../LEARNING.md).
The five that changed how the system is designed:

1. **`if` vs `while`** — the naive agent handles one tool call and stops. The loop only ends when
   the model returns *no* tool calls.
2. **`git worktree` vs `git checkout -b`** — checkout switches branches **in place**; worktree
   creates a **second directory** sharing one `.git`. That is what makes parallel agents possible,
   and it's why `Session` is a first-class table: *session ≈ worktree ≈ branch*.
3. **Approvals are DB state, not a promise** — the answer may arrive at a different process (or
   device) than the question.
4. **NAT and the Bridge** — a local machine has no public address, so it dials **out** and holds
   the connection open. The server never reaches in.
5. **Planner as compiler** — prompt → IR (Blueprint) → task DAG → codegen. A prompt produces no
   artifact; a plan produces one you can inspect, cache, diff, and resume.

## Engineering Decisions Made
All recorded with trade-offs in [DECISIONS.md](../DECISIONS.md).

- **D4 — TypeScript for the agent engine** *(closes Session 02's open question)*. The stack is
  already TS end to end, types are shared through `libs/ts/contracts`, and the reference impl is
  TS. `apps/agent-engine` (Python) is deleted. Given up: the Python AI ecosystem — acceptable,
  since we call LLM APIs directly and deliberately own the loop.
- **D5 — Postgres, not the deck's SQLite.** SQLite is genuinely right for a *local, single-user*
  agent; we're building a *hosted, multi-tenant* one, where a single writer on a single box is a
  hard blocker. `libs/ts/db` is already Postgres.
- **D6 — Cloud sandboxes from V3.** LLM-authored `bash` is arbitrary code execution; locally it
  runs as you, with your keys.
- **D7 — Bridge/remote control deferred to Track B.** It solves "reach a machine I can't address" —
  our sandboxes are ours. Kept possible by two invariants held from V1: **all state in the DB**,
  **every event carries a `seq`**.
- **D8 — Session = worktree = branch.**
- **D9 — Deterministic engines over bigger prompts** (the V4 thesis).

## The plan that came out of it
```
V0 agent loop → V1 web app + memory → V2 isolation & control
   → V3 cloud sandbox → V4 app builder (Emergent parity) → V5 autonomy & deploy
```
Each version has one acceptance test; V3 is the hard one (distributed systems).
See [VERSIONS.md](../VERSIONS.md).

## Homework Before Next Session
- Read `ref-ai/packages/agent/src/agent-loop.ts` end to end and answer, in your own words:
  (a) where does the loop exit? (b) how is truncation detected? (c) why are some tool calls run in
  parallel and others sequentially? *(You are about to reimplement this — if you can't answer all
  three, read it again.)*
- Confirm D4 and D5, then delete `apps/agent-engine/` in its own commit.
- Settle **O1** in [DECISIONS.md](../DECISIONS.md): full-stack or
  frontend-only for the V4 app builder? It silently shapes every V4 slice.

## Next Session Plan
Start [V0](../versions/V0_AGENT_LOOP.md): scaffold `libs/ts/agent-core`, define `Message` / `AgentEvent`
(with `seq`) / `Tool` in `libs/ts/contracts`, then build the loop — `while`, not `if`, with a real
`emit` sink from the first line.
