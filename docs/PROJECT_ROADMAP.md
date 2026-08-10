# Project Roadmap: Devian Agent Builder

> **North star:** an Emergent/Lovable-style AI app builder — one sentence in, a working,
> deployed application out.
>
> The detailed schedule lives in [VERSIONS.md](./VERSIONS.md) and [versions/](./versions/).
> This file is the **status board**: where we are right now, and what happens next.

---

## Current Phase

**Phase 0 → V0: rebuild the agent loop.**

Phase 0 (understand the product, choose the architecture) is **complete**. The architecture is
written down in [ARCHITECTURE.md](./ARCHITECTURE.md) and the open questions from Sessions 01–02
are resolved in [DECISIONS.md](./DECISIONS.md).

---

## ⚠️ Reality check — the code state changed

The earlier roadmap described a system that is no longer on disk:

- `apps/opencode/` — which held the **working TypeScript agent loop** (`agentLoop.ts`, tools,
  subagents) — has been **deleted** from the working tree.
- `services/orchestrator/src/index.ts` is an **empty file** (0 lines) — V3 fills it in.
- `services/api/src/index.ts` is a **5-line stub**.
- `services/web` is still the **Vite starter**.
- `apps/worker/` was an empty placeholder — **deleted**; the Python agent service plays the worker
  role from V3.
- The old `apps/agent-engine/` Python scaffold was **deleted 2026-08-10**; the Python engine is
  rebuilt properly at `libs/py/agent_core` + `libs/py/tools`
  ([D4](./DECISIONS.md#decision-4-python-for-the-agent-engine--active-confirms-d1)).
- `script/reset-project.mjs` pointed at paths that don't exist — **deleted 2026-08-10**.
- **Whole repo restructured 2026-08-10:** `apps/` + `packages/` + Turborepo →
  `services/` + `libs/` + Docker Compose + Makefile
  ([D11](./DECISIONS.md#decision-11-docker-compose--makefile-instead-of-turborepo--active-supersedes-d3),
  [D12](./DECISIONS.md#decision-12-repo-layout--services--libs--active)).

**`ROADMAP.md`'s own "live design state" was also stale.** Three of its blocking problems no longer
exist and were corrected in place:

| Claim | Reality |
|---|---|
| nested `.git` inside the template | none exists anywhere |
| `projectFiles.ts` has a `frontend`/`fronted` typo | no typo, no such line |
| `projectRoot` is a module-level global | already per-project: `workspaceRoot(projectId)` |

**What survives and matters:** `ref-ai/packages/` (a complete TypeScript agent loop to port from),
`libs/ts/db` (Prisma), **`libs/ts/contracts/src/utils/projectFiles.ts` (per-project workspace +
path-escape guard — already correct, reuse it)**, `templates/vite-react`, and the design
thinking in `ROADMAP.md`.

**So: the effective starting position is near-greenfield with a very good map.** That is not a
setback — the map is the expensive part.

---

## Completed ✅

- [x] Understood the MVP constraints and product requirements.
- [x] Analysed the reference implementation in `ref-ai/packages`.
- [x] Extracted the full architecture from the *Coding Agents + Cloud* deck → [ARCHITECTURE.md](./ARCHITECTURE.md).
- [x] **Resolved the Python vs TypeScript question** → **Python** for the agent engine, TypeScript for web + API ([D4](./DECISIONS.md)). *Decided by the user, 2026-08-10.*
- [x] **Answered the cross-language type problem** → Pydantic is the source of truth, TS types generated ([D10](./DECISIONS.md)).
- [x] **Replaced Turborepo** → Docker Compose + Makefile ([D11](./DECISIONS.md)).
- [x] **Restructured the repo** → `services/` + `libs/` ([D12](./DECISIONS.md)).
- [x] **Resolved the database question** → Postgres, deviating from the deck's SQLite, with reasons ([D5](./DECISIONS.md)).
- [x] **Decided the execution model** → cloud sandboxes from V3 ([D6](./DECISIONS.md)).
- [x] **Scoped remote control / handoff** → Track B, deferred, with the invariants that keep it possible ([D7](./DECISIONS.md)).
- [x] Defined the version ladder V0–V5 with acceptance tests → [VERSIONS.md](./VERSIONS.md).
- [x] Wrote per-version TODOs → [versions/](./versions/).
- [x] Mapped the learning curve → [LEARNING_PATH.md](./LEARNING_PATH.md).
- [x] **V0 Slice 0 (housekeeping)** — Python packages scaffolded, uv workspace, Makefile, Compose.

---

## Current task 🚧 — V0, Slice 1

Full detail: [versions/V0_AGENT_LOOP.md](./versions/V0_AGENT_LOOP.md)

- [ ] `make install` runs clean; `make types` passes on the empty scaffold.
- [ ] Read `ref-ai/packages/agent/src/agent-loop.ts` end to end and answer the three questions in
      [LEARNING_PATH.md → V0](./LEARNING_PATH.md#v0--the-loop) before writing code. It's
      TypeScript and we're writing Python — port the **structure**, not the syntax.
- [ ] Define `Message`, `AgentEvent` (with `seq`), and the `AgentEventSink` protocol as Pydantic
      models in `libs/py/agent_core/src/agent_core/types.py`.
- [ ] Wire `make contracts` and confirm the generated TypeScript looks sane.

**V0 exit criterion:** `make agent ARGS='"read package.json, then add a clean script to it"'`
produces **two chained tool calls in one turn with no human input between them.**

---

## Next up 📌

- [ ] V0 Slices 2–7 — provider, tools, loop, system prompt, CLI, proof.
- [ ] V1 Slice 1 — rewrite `libs/ts/db/prisma/schema.prisma` to `Project · Session · Message`.
- [ ] V1 Slice 3 — `POST /conversation` with SSE + persistence of every turn.

---

## Not blocked on anything

The architectural decision that blocked the previous roadmap (Python vs TypeScript) is closed.
There is nothing waiting on a decision to start V0.

---

## Milestones

| Milestone | Version | Meaning |
|---|---|---|
| **M1 — the loop works** | [V0](./versions/V0_AGENT_LOOP.md) | Multi-step tool chains complete unattended |
| **M2 — it's a product** | [V1](./versions/V1_WEB_APP.md) | Browser UI, live streaming, history survives a refresh |
| **M3 — it's trustworthy** | [V2](./versions/V2_ISOLATION_AND_CONTROL.md) | Worktrees, approvals, diffs, verification |
| **M4 — it's a service** | [V3](./versions/V3_CLOUD_SANDBOX.md) | Cloud sandboxes, multi-user, parallel builds |
| **M5 — Emergent parity** | [V4](./versions/V4_APP_BUILDER.md) | One prompt → a whole working app, via a visible plan |
| **M6 — it ships itself** | [V5](./versions/V5_AUTONOMY_AND_DEPLOY.md) | Self-healing + one-click deploy to a live URL |

---

## Document map

| File | What it's for |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | The full system: diagrams, data model, every layer, deviations from the deck |
| [VERSIONS.md](./VERSIONS.md) | The version ladder V0–V5, acceptance tests, sequencing rules |
| [versions/](./versions/) | Per-version TODOs, traps, files touched, definition of done |
| [DECISIONS.md](./DECISIONS.md) | Every architectural decision + trade-off + what's still open |
| [LEARNING_PATH.md](./LEARNING_PATH.md) | What to learn per version, and how to know you know it |
| [LEARNING_LOG.md](./LEARNING_LOG.md) | Running log of concepts actually mastered |
| [CODE_QUALITY.md](./CODE_QUALITY.md) | How we write code here — patterns from `ref-ai`, in Python |
| [INTERVIEW_PREP.md](./INTERVIEW_PREP.md) | Per-version interview questions from this architecture |
| [SESSION_0N.md](./SESSION_01.md) | Per-session notes |
| [`../ROADMAP.md`](../ROADMAP.md) | Deep design reference for the frontend-builder / registry thinking. **Not** the schedule of record — this file and VERSIONS.md are |
