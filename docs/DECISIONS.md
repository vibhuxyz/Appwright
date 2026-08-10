# Architecture Decisions (DECISIONS.md)

> One entry per decision: **what**, **why**, and **what we gave up**. A decision without a
> recorded trade-off isn't a decision, it's a preference. Superseded entries stay — the history
> of why we changed our minds is worth more than a tidy list.

---

## Decision 1: Language & architecture for the Agent Engine ⚠️ SUPERSEDED by D4
**Decision (was):** Build the Agent Engine in **Python**, adopting the architectural patterns from `ref-ai`.
**Why we chose it:** Python gives access to the native AI ecosystem.
**Trade-offs we accepted:** a network/language boundary.
**History:** briefly replaced by a TypeScript recommendation, reinstated by the user on 2026-08-10, then **reversed again on 2026-08-10** after `ref-ai/packages` turned out to be 142k lines of MIT-licensed, *published* TypeScript. See [D4](#decision-4-typescript-end-to-end--active-supersedes-d1).

---

## Decision 2: The Two-Directory Sandbox Model ✅ ACTIVE (V1), superseded at V3
**Decision:** A pristine `project-template/` is copied into a per-project working directory; the agent only ever edits the copy.
**Why we chose it:** Prevents LLM mistakes from destroying the pristine template.
**Trade-offs:** No real isolation — the agent still runs as you, on your disk, with your credentials. It protects the *template*, not the *machine*.
**When we change it:** **V3.** Real isolation requires cloud sandboxes (E2B). The two-directory model remains correct for V0–V2 local development.

---

## Decision 3: Monorepo tooling ⚠️ SUPERSEDED by D11
**Decision (was):** Turborepo, with Bun as the package manager.
**Why we chose it:** Nx's third-party Python plugin (`@nxlv/python`) introduced immediate operational friction, so we reverted to Turborepo.
**Why it stopped working:** we went polyglot, and Turborepo does not orchestrate Python.
**How it ended:** we went back to one language ([D4](#decision-4-typescript-end-to-end--active-supersedes-d1)), which removed the reason for *any* extra task runner. Four passes over this question — Turborepo → Nx → Turborepo → Make → nothing — taught one lesson: **the tooling question is downstream of the language question. Settle the language first and most tooling debates evaporate.**
**Superseded:** see [D11](#decision-11-no-task-runner--active-supersedes-d3).

---

## Decision 4: TypeScript end to end ✅ ACTIVE *(supersedes D1)*
**Decision:** The whole stack is **TypeScript**. The agent engine is a *library* (`libs/ts/agent-core` + `libs/ts/tools`), not a service. Python returns at V5 only if a specific job needs it — see [D13](#decision-13-python-arrives-at-v5--only-if-a-job-needs-it--active).
**Decided by:** the user, 2026-08-10, after weighing the evidence below. This reverses a Python decision made earlier the same day.

**What changed our minds — `ref-ai/packages` is not just reference code:**

```
@earendil-works/pi-ai          v0.84.1   MIT   31 provider adapters, auth, token + cost tracking
@earendil-works/pi-agent-core  v0.84.1   MIT   the harness: loop, tools, sessions, compaction
@earendil-works/pi-evals              …  MIT   model-backed behavioural checks  ← the V5 argument
```

Published, MIT-licensed npm packages — 142k lines across 10 packages. In TypeScript we can **read and port the loop** (which teaches us something) while **installing the provider layer** (which does not — after the second adapter you are copying JSON shapes). In Python all of it is reference-only.

**The argument that decided it — our own rule.** D1's Python justification was *"V5's memory/RAG/eval work is easier in Python."* V5 is months away. Paying a language boundary today for a benefit at the end is exactly what *"never optimise before you have felt the limitation"* forbids. And the V5 eval advantage turned out to be false: `ref-ai/packages/evals` already exists, in TypeScript, in this repo.

**Costs we were already paying after four days, for nothing yet:**

| Cost | Where it bit |
|---|---|
| Type drift | needed D10 — a whole codegen step |
| Two toolchains | `uv` + `bun`, two lockfiles, two installs |
| Two Docker patterns | `docker/api` and `docker/agent` shared no logic |
| Workspace subtleties ×2 | bun "Workspace not found" **and** the `devian-serve` PATH bug |
| A network hop | the API could not `import` the loop |

**The biggest structural win: the agent stops being a service.**

```
before   browser → api (TS) ──HTTP/SSE──► agent (PY) → tools → files
after    browser → api (TS) ── import ──► @repo/agent-core → @repo/tools → files
```

No serialisation, no second process, no `AGENT_URL`, no contract generation. At V3 a **worker** imports the same package and runs beside a sandbox — that separation returns *for isolation*, which is a real reason, rather than as an artifact of language choice.

**What we give up:** the Python AI ecosystem, and learning a second stack on this project. Accepted — see [D13](#decision-13-python-arrives-at-v5--only-if-a-job-needs-it--active) for how it comes back.

**What we deliberately do NOT do:** no LangChain, no agent framework. We call provider APIs directly (or through `pi-ai`, which is a thin typed client, not a framework). The loop is the product.

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

## Decision 10: One type definition, shared by import ✅ ACTIVE *(replaces the codegen plan)*
**Decision:** `Message`, `AgentEvent`, and tool argument schemas are defined **once**, as Zod schemas in `libs/ts/agent-core/src/types.ts`. Every consumer — API, worker, browser — **imports** them. No code generation, no build step, no generated directory.

```
libs/ts/agent-core/src/types.ts     ← the only definition
        │
        ├── import ──► services/api        (persists them)
        ├── import ──► services/web        (renders them)
        └── import ──► services/worker     (emits them, from V3)
```

**History:** this entry previously described Pydantic-as-source-of-truth with a type imports step generating TypeScript. That existed only because the agent was Python ([D4](#decision-4-typescript-end-to-end--active-supersedes-d1)). One language deleted the problem — **the best fix for a hard problem is often removing the thing that created it.**

**Why Zod and not plain TS types:** the agent's tool arguments arrive from an LLM and cannot be trusted. Zod validates at runtime *and* infers the static type, and `z.toJSONSchema()` produces the schema the model is given. One definition, three jobs, no drift. `libs/ts/contracts` already uses Zod for HTTP validation, so it is one library, not two.
**Trade-offs:** none material. Zod adds a runtime dependency and a little parse cost on hot paths — irrelevant next to an LLM round-trip.

---

## Decision 11: No task runner ✅ ACTIVE *(supersedes D3)*
**Decision:** No Turborepo, no Nx, no Make, no `just`. **`package.json` scripts** are the command surface; **Docker Compose** runs the stack.

```bash
bun install
bun run agent "add a dark mode toggle"     # the V0 harness
bun run dev:api          bun run dev:web    # host-native, fast inner loop
bun run dev                                 # docker compose up
bun run check-types      bun run test       bun run lint
```

**Why:** a task runner earns its place when it bridges toolchains or caches a slow task graph. After [D4](#decision-4-typescript-end-to-end--active-supersedes-d1) there is one toolchain — `bun` — and it already has workspaces, filters, and a script runner. A Makefile whose every target was a one-to-one alias of an equally short `bun` command was pure indirection: one more file to keep in sync, and a second place to look for the truth.

**The pattern worth remembering:** Turborepo → Nx → Turborepo → Make → nothing. Every one of those changes was chasing a language decision. Once the language settled, the tooling question answered itself.
**Trade-offs:** we lose Turborepo's task graph and remote caching. At three services that is not the bottleneck. **When we would revisit:** if `bun run check-types` across the workspace gets slow enough to notice.

---

## Decision 12: Repo layout — `services/` + `libs/` ✅ ACTIVE
**Decision:** Deployable units in `services/`, importable code in `libs/`.

```
services/   web · api · orchestrator (V3)      ← things that run as a process
libs/ts/    agent-core · tools · contracts · db · ui · config · eslint-config · typescript-config
templates/  vite-react                          ← the pristine starter the agent copies
docker/     api/ · web/                         ← one Dockerfile per service, root build context
docs/       the plan
```

**Why:** the old `apps/` + `packages/` names came from a Turborepo convention we no longer use, and said nothing about what deploys. `services/` vs `libs/` answers the question that matters — *does this ship as a process, or get imported?*

**Why `libs/ts/` and not just `libs/`** now that there is only one language: [D13](#decision-13-python-arrives-at-v5--only-if-a-job-needs-it--active) may add `libs/ts/` at V5. One extra path segment today is cheaper than renaming eight packages later. If V5 never needs Python, flatten it then.

**Note:** `services/agent` was deleted — with the engine in TypeScript it is a library, not a service ([D4](#decision-4-typescript-end-to-end--active-supersedes-d1)). `services/worker` appears at V3 for **isolation**, which is a real reason.
**Trade-offs:** every path in the docs changed at once. Done deliberately, in one pass, rather than drifting.

---

## Decision 13: Python arrives at V5 — only if a job needs it ✅ ACTIVE
**Decision:** The stack is TypeScript. If V5's memory/eval work genuinely needs Python, it arrives as **one small service** (`services/ml`), not a rewrite.

**What that service would be:** ~300 lines, two endpoints.

```
POST /embed    { texts: string[] }  →  { vectors: number[][] }
POST /rerank   { query, docs }      →  { scores: number[] }
```

It would not touch the agent loop, Postgres, or the API. It is called like any other HTTP dependency.

**Why this ordering is cheaper — the cost of a boundary scales with what crosses it:**

| Boundary | What crosses | Cost |
|---|---|---|
| The one we removed | the whole agent event stream — streaming, ordered, resumable by `seq`, dozens of types | codegen, two toolchains, two Docker patterns, a hop in every run |
| A V5 ML service | two request/response pairs, no streaming | a `fetch` call and one Zod schema |

Same "language boundary" — roughly 5% of the cost, and only once there is a reason.

**Most likely outcome: we never build it.** If V5's memory is *"call an embeddings API, store the vector in pgvector, `ORDER BY embedding <=> query`"* — the common case — Postgres does the vector search and TypeScript makes one HTTP call.

**Where Python would genuinely win, and would justify the service:** running models locally (sentence-transformers, a local reranker), real numerical analysis of agent traces (numpy/pandas), or fine-tuning. All data/ML work, none of it application work.
**Trade-offs:** if we are certain at V5 that we need Python, we will have written some V0–V4 code we would otherwise have written there. Accepted — that code is the agent loop and the planner, which are application logic and belong in TypeScript regardless.

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

*See also:* [ARCHITECTURE.md](./ARCHITECTURE.md) · [VERSIONS.md](./VERSIONS.md) · [LEARNING.md](./LEARNING.md)
