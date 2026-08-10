# Architecture Decisions (DECISIONS.md)

> One entry per decision: **what**, **why**, and **what we gave up**. A decision without a
> recorded trade-off isn't a decision, it's a preference. Superseded entries stay — the history
> of why we changed our minds is worth more than a tidy list.

---

## Decision 1: Language & architecture for the Agent Engine ✅ REINSTATED — see D4
**Decision:** Build the Agent Engine in **Python**, adopting the architectural patterns from `ref-ai/packages`.
**Why we chose it:** Python gives access to the native AI ecosystem; we port event-streaming and provider abstraction from the TS reference.
**Trade-offs:** Introduces a network/language boundary.
**History:** briefly superseded by a TypeScript recommendation, then **reinstated by the user on 2026-08-10**. See [D4](#decision-4-python-for-the-agent-engine--active-confirms-d1) for the current, fuller version and the costs we are accepting.

---

## Decision 2: The Two-Directory Sandbox Model ✅ ACTIVE (V1), superseded at V3
**Decision:** A pristine `project-template/` is copied into a per-project working directory; the agent only ever edits the copy.
**Why we chose it:** Prevents LLM mistakes from destroying the pristine template.
**Trade-offs:** No real isolation — the agent still runs as you, on your disk, with your credentials. It protects the *template*, not the *machine*.
**When we change it:** **V3.** Real isolation requires cloud sandboxes (E2B). The two-directory model remains correct for V0–V2 local development.

---

## Decision 3: Monorepo tooling ⚠️ SUPERSEDED by D11
**Decision (was):** Turborepo, with Bun as the package manager.
**Why we chose it:** We briefly tried Nx for native Python dependency support, but third-party Nx plugins (`@nxlv/python`) introduced immediate operational friction (missing generators). Following *never optimise before experiencing the limitation*, we reverted to Turborepo.
**Why it stopped working:** [D4](#decision-4-python-for-the-agent-engine--active-confirms-d1) makes the stack polyglot again, and Turborepo does not orchestrate Python. This is the **third** pass over the same question (Turborepo → Nx → Turborepo → Compose+Make), and the pattern is now clear: *the tool must follow the language decision, not the other way round.*
**Superseded:** see [D11](#decision-11-docker-compose--makefile-instead-of-turborepo--active-supersedes-d3).

---

## Decision 4: Python for the Agent Engine ✅ ACTIVE *(confirms D1)*
**Decision:** The agent engine is **Python**. It lives in `libs/py/agent_core` + `libs/py/tools`, exposed as a service at `services/agent`. TypeScript keeps the web app and the API.
**Decided by:** the user, 2026-08-10, overriding an earlier TypeScript recommendation. Reverts to the original D1 position.

**Why Python:**
- The native AI ecosystem is Python-first: provider SDKs land there first, and V5's memory/RAG/eval work (embeddings, retrieval scoring, error-class metrics) is materially easier there.
- The loop is the part of this system worth owning deeply. Writing it in the language its ecosystem is documented in reduces friction on every future integration.
- It matches the user's stated intent for the project. Direction beats local optimisation.

**Scope — Python owns the agent only:**

| Layer | Language | Why |
|---|---|---|
| `services/web` | TypeScript | React. Not in question. |
| `services/api` | TypeScript | Existing Express + Prisma + Zod work survives. Owns HTTP, auth, persistence, SSE to the browser. |
| `services/agent` | **Python** | The loop, tools, providers. |
| `services/orchestrator` | TypeScript | V3. Job state machine only — no agent code, so no reason to move it. |

**What we give up (the honest cost):**
1. **A real network/language boundary** — exactly the cost D1 named. The API cannot `import` the loop; it calls it over HTTP/SSE.
2. **Types no longer shared by import.** `Message` and `AgentEvent` now exist in Pydantic *and* TypeScript. Left alone, they drift. → answered by [D10](#decision-10-pydantic-is-the-source-of-truth-for-cross-language-types--active).
3. **Two toolchains** — `uv` + `bun`, two lockfiles, two test runners. → answered by [D11](#decision-11-docker-compose--makefile-instead-of-turborepo--active-supersedes-d3).
4. **The `ref-ai/packages` reference is TypeScript.** We now port *across* languages, which loses fidelity. Mitigation: port the **structure** (event sink, provider protocol, truncation handling, parallel-vs-sequential execution) rather than transliterating the code.

**What we deliberately do NOT do:** no LangChain, no LlamaIndex, no agent framework. We call the provider HTTP APIs directly. The loop *is* the product — an abstraction over it hides exactly the thing we are trying to learn and control.

**When we would revisit:** if the HTTP hop between API and agent becomes a measured latency or reliability problem — not before.

---

## Decision 5: Postgres, not SQLite *(deviates from the deck)* ✅ ACTIVE
**Decision:** **Postgres** via Prisma (`libs/ts/db`) — not the deck's SQLite.
**Why the deck says SQLite, and why it's right for the deck's product:** a local coding agent is single-user and single-writer; the data is inherently per-machine; and shipping a desktop app that also demands "install Postgres first" is a non-starter. Serverless, zero-config, one file.
**Why we choose differently:** we are building a **hosted, multi-tenant** product ([D6](#decision-6-cloud-sandboxes-over-local-execution--active-target-v3)). SQLite has one writer and lives on one machine — the moment there are two API instances, or one user's data must be isolated from another's, it stops working. `libs/ts/db` is already Postgres, so this is also the zero-cost path.
**Trade-offs:** Postgres must be running for local dev (Docker, or a hosted dev branch). We accept that friction now instead of migrating a live schema at V3.
**Where SQLite still wins:** a future local/CLI mode (Track B). If we ship that, it gets its own SQLite store — not a shared abstraction over both.

---

## Decision 6: Cloud sandboxes over local execution ✅ ACTIVE *(target: V3)*
**Decision:** From V3, the agent executes inside a **disposable cloud sandbox**, one per project. The API server never runs agent-authored code.
**Why we chose it:**
- **Security** — an LLM emitting `bash` is arbitrary remote code execution. Locally that runs as you, with your `~/.ssh` and `~/.aws`.
- **Availability** — a build must not stop because a laptop slept.
- **Concurrency** — one machine is one build; a product needs N.
**Trade-offs:** Significant new complexity (queue, orchestrator, sandbox manager, snapshots) and real per-minute cost. Cold starts add latency, paid down with a warm pool. This is the version where the project stops being simple — and there is no version of the product where it can be skipped.
**Mitigation:** a `SandboxProvider` port with a `LocalSandboxProvider` first, so every caller is ported to the interface before cloud latency enters the debugging loop.

---

## Decision 7: Remote control / Bridge deferred to Track B ✅ ACTIVE
**Decision:** The deck's Bridge (ws from the local machine, https from the web) is **not** on the critical path. Parked as Track B, after V4.
**Why we chose it:** The Bridge exists to reach a machine we cannot address — behind NAT, no public IP. Under [D6](#decision-6-cloud-sandboxes-over-local-execution--active-target-v3) the agent runs in *our* sandboxes, which are addressable by definition. The bridge solves a problem we do not have.
**Trade-offs:** We give up "run the agent against a private repo that never leaves my machine" — a real feature for some users, and the thing that would make handoff (deck milestone 3) meaningful.
**Constraint this places on every earlier version:** all session state stays in the DB, and every event carries a monotonic `seq`. With those two invariants, Track B is additive later; without them it's a rewrite.

---

## Decision 8: Session = worktree = branch ✅ ACTIVE *(target: V2)*
**Decision:** Each agent session gets its own `git worktree` on its own `agent/<sessionId>` branch. Merging back to `main` is an explicit, user-triggered action.
**Why we chose it:** `git checkout -b` switches branches **in place** — one working directory, one branch, so two agents cannot work at once and switching yanks files out from under a running agent. A worktree gives a second physical directory sharing one `.git` object store. It also gives review (`git diff main...agent/x`), rollback, and merge semantics for free.
**Trade-offs:** More directories to manage and to clean up (orphaned worktrees after a crash need `git worktree prune`). Disk usage grows per session. Conflicts must be surfaced to the user — we deliberately do **not** auto-resolve.
**Open:** once every session has its own sandbox (V3), is the worktree redundant? *Current answer: no — the sandbox isolates execution, the worktree provides diff/review/merge semantics and parallel tasks within one project.*

---

## Decision 9: Deterministic engines over bigger prompts ✅ ACTIVE *(target: V4)*
**Decision:** Push intelligence **out** of the LLM into deterministic code. The LLM does intent classification, a few clarifying questions, and app-specific code generation. Stack selection, component selection, workspace composition, and task ordering are code.
**Why we chose it:** A prompt produces no artifact. A planner produces a **Blueprint** — inspectable before any code is written, cacheable, diffable, resumable, debuggable. When output is wrong you can tell whether it was a planning failure or a generation failure, which you cannot do with one large prompt.
**Trade-offs:** Deterministic engines are hand-authored content — the registries, rules, and templates are real work, and they're also the moat. It's slower to start and far more reliable at scale.
**Guardrail:** start with **one** stack and 3–5 registry blocks, not five stacks and 400 blocks. Prove the loop before paying the authoring cost.

---

## Decision 10: Pydantic is the source of truth for cross-language types ✅ ACTIVE
**Decision:** `Message`, `AgentEvent`, and tool argument schemas are defined **once**, as Pydantic models in `libs/py/agent_core/types.py`. TypeScript types are **generated** from them via JSON Schema. Never hand-written on both sides.

```
libs/py/agent_core/types.py   (Pydantic — source of truth)
          │
          │  make contracts
          ▼
libs/ts/contracts/src/generated/schema.json
          │
          ▼
libs/ts/contracts/src/generated/agent-events.ts   (generated — never edit by hand)
```

**Why this direction:** the agent *produces* the events; the API and browser only *consume* them. The producer should own the shape. Pydantic also already validates at runtime on the Python side, so the schema is not extra work — it falls out of code we need anyway.
**Why it matters:** this is the single biggest risk of going polyglot ([D4](#decision-4-python-for-the-agent-engine--active-confirms-d1) cost #2). Two hand-mirrored type definitions drift silently, and the failure shows up as a rendering bug in the browser three weeks later.
**Trade-offs:** a build step (`make contracts`) that must be run and committed whenever the event shape changes. Generated TS is less idiomatic than hand-written. Both are cheaper than drift.
**Rule:** generated files are committed, and `make contracts` runs in CI with a diff check — a dirty tree fails the build.

---

## Decision 11: Docker Compose + Makefile instead of Turborepo ✅ ACTIVE *(supersedes D3)*
**Decision:** No monorepo build tool. **Docker Compose** runs the services; a **Makefile** is the single command surface. `bun` workspaces manage TypeScript deps, `uv` workspaces manage Python deps.
**Why we chose it:** Turborepo cannot orchestrate Python — that is what pushed us to Nx and back once already ([D3](#decision-3-monorepo-tooling--superseded-by-d11)). Compose is polyglot by nature, and it is the same shape V3 needs anyway (postgres, redis, api, agent, sandboxes), so local dev and cloud deployment stay close instead of diverging.
**Trade-offs:** we lose Turborepo's task graph and remote caching. Acceptable at this size — with three services, `make dev` is not the bottleneck. Container startup is slower than a native process, so the Makefile keeps `make dev-api` / `make dev-agent` / `make agent` as host-native escape hatches for fast inner loops.
**When we would revisit:** if builds get slow enough to notice. Not before — same principle as always.

---

## Decision 12: Repo layout — `services/` + `libs/` ✅ ACTIVE
**Decision:** Deployable units in `services/`, importable code in `libs/`, split by language underneath.

```
services/   web (TS) · api (TS) · agent (PY) · orchestrator (TS, V3)
libs/py/    agent_core · tools
libs/ts/    contracts · db · ui · config · eslint-config · typescript-config
templates/  vite-react            ← the pristine starter the agent copies
docs/       the plan
```

**Why we chose it:** the old `apps/` + `packages/` names came from a Turborepo convention we no longer use, and they said nothing about what deploys. `services/` vs `libs/` answers the question that actually matters — *does this ship as a process, or get imported?* The language split under `libs/` keeps `uv` and `bun` workspace globs clean and unambiguous.
**Trade-offs:** every path in the docs and in imports changed at once. Done deliberately in one pass rather than drifting. `services/agent` was dropped — the Python agent service plays the worker role from V3, so a separate empty TS worker was a placeholder for nothing.

---

## Open — not yet decided

These block work when they're reached. Each needs an entry above before the relevant slice starts.

| # | Question | Blocks | Notes |
|---|---|---|---|
| O1 | **Full-stack or frontend-only** for the V4 app builder? | V4 Slice 1 | `ROADMAP.md` locks frontend-only + mock data; Emergent is full-stack. Decides how many generation agents exist and what "verified" means. *Lean: frontend-only for the first loop, backend as V4.5.* |
| O2 | **Sandbox provider** — E2B vs Fly Machines vs raw Firecracker | V3 Slice 1 | *Lean: E2B behind a `SandboxProvider` port.* |
| O3 | **Sandbox lifetime** — long-lived per project vs ephemeral + snapshot restore | V3 Slice 6 | *Lean: ephemeral + warm pool + object-store snapshots.* |
| O4 | **Queue** — BullMQ/Redis vs pg-boss/Postgres | V3 Slice 3 | Redis is likely needed anyway for pub/sub. |
| O5 | **Approval timeout** — expire, or park indefinitely? | V2 Slice 3 | Affects the session state machine. |
| O6 | **Secrets into a fresh worktree/sandbox** — `.env` is gitignored, so a new workspace has none. Who injects, and how do we keep them out of LLM context? | V2/V3 | `Secret` model already exists in `libs/ts/db`. |
| O7 | **Blueprint mutability** — can a later task amend the frozen architecture, or does that force a re-plan? | V4 Slice 3 | |

---

*See also:* [ARCHITECTURE.md](./ARCHITECTURE.md) · [VERSIONS.md](./VERSIONS.md) · [LEARNING_PATH.md](./LEARNING_PATH.md)
