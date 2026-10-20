# V4 — App Builder ◄ Emergent parity

> **Goal:** one sentence in, a whole working application out — via a visible plan that executes
> task by task, each verified before the next begins.
>
> **Status:** 🟡 in progress — planner, scheduler, executor, verifier, workspace composer, and the
> plan/blueprint UI are built and typecheck/build clean; the UI-system design layer (Slice 1b/3b/4c)
> and the lazy incremental re-plan UX (Slice 8) are not · **Est.** remaining: 1–2 weeks ·
> **Depends on:** [V3](./V3_CLOUD_SANDBOX.md)

---

## Implementation status — 2026-10-19

**Answer to "is V4 built?": mostly as a library, and now partly wired into the live app. The
planner, task graph, scheduler, executor, verifier, workspace composer, and the
plan/blueprint/question-flow UI were all built and typechecking/passing tests — but as of this
morning, nothing in `apps/api` ever called `planBlueprint()`. A real user prompt still only ran
the old V1.2 single-agent loop; no route ever created a `Blueprint` row. `POST
/sessions/:sessionId/blueprint` (added today) closes that gap for blueprint generation: it
classifies intent (LLM), generates entities/pages/features/theme (LLM), runs the deterministic
`decideArchitecture()` + `planBlueprint()`, and persists the result as real `Blueprint`/`Task`
rows. What it does **not** yet do is execute the tasks — `runPersistedRun()` needs a real
`TaskGenerator` (still just a port/interface, see below) and nothing calls it after persisting.
Also still missing: the UI-system design layer (Slice 1b/3b/4c) and the lazy-boot incremental
re-plan UX (Slice 8).**

| Piece                                                           | State | Where                                                              |
| --------------------------------------------------------------- | ----- | ------------------------------------------------------------------ |
| Blueprint + Task Zod contracts                                  | done  | `packages/contracts/src/{blueprint,task}.schema.ts`                |
| `Blueprint · Task · Run · TaskAttempt · RunEvent · ChangeRequest` tables | done  | `packages/db/prisma/migrations/20261016135401_add_v4_blueprint_tasks` |
| Ownership canonicalise / overlap / breadth warning (D37)        | done  | `packages/planner/src/ownership`                                   |
| Computed edges + ownership conflicts + topological levels (D30) | done  | `packages/planner/src/task-graph`                                  |
| Risk tier, capability, verification floor by task type (D32)    | done  | `packages/planner/src/task-policy`                                 |
| BlueprintValidator (schema, duplicate/dangling entities, routes) | done  | `packages/planner/src/blueprint`                                   |
| TaskCompiler (blueprint → tasks with `owns`/`reads`)            | done  | `packages/planner/src/compile`                                     |
| TaskGraphValidator (cycles, duplicate ids, bad ownership, task cap, over-budget) | done  | `packages/planner/src/validate`                                    |
| `planBlueprint()` — validate → compile → validate, never repairs (D39) | done  | `packages/planner/src/plan`                                        |
| Requirement engine, confidence scoring, ≤3 adaptive questions (Slice 2, deterministic half) | done (unused on the live path — see below) | `packages/planner/src/requirements/{select-questions,apply-answers}.ts` |
| AI-generated intake questions, multiple-choice options (D72)   | done  | `apps/api/src/intake` · `packages/planner/src/requirements/{generate-questions,apply-prompt-answers}.ts` · `apps/web/src/features/plan/components/question-flow` |
| Intent classifier (LLM, structured output) (Slice 2)            | done  | `packages/planner/src/intent/classify-intent.ts`                    |
| Architecture decision engine: rules + frozen result (Slice 3)   | done  | `packages/planner/src/architecture`                                |
| ACR review + diff + blueprint versioning (Slice 4b)              | done  | `packages/planner/src/change-request`                               |
| Scheduler: 5 dispatch gates + wait reasons (Slice 4)            | done  | `apps/orchestrator/src/scheduler/{gates,schedule}.ts`               |
| Run executor: retry ≤N, block dependents, resume, cancel, budget | done  | `apps/orchestrator/src/executor`                                    |
| Write fence per task (pure path check against `owns`) (Slice 4) | done  | `packages/planner/src/write-fence`                                 |
| Postgres-backed executor ports (Slice 4)                        | done  | `apps/orchestrator/src/executor/postgres`                           |
| Context assembler: deterministic sections, byte budget, drop order (Slice 6, assembly half) | done  | `packages/planner/src/context`             |
| Workspace composer: deterministic plan (deps + theme CSS) (Slice 5) | partial — plan is pure/tested, not wired to copy the template or run installs | `packages/workspace/src/compose` |
| Per-task verifier; risk→tier mapping computed (Slice 7)         | partial — runs after every task, but tier selection isn't wired into the verifier | `apps/orchestrator/src/executor/verifier` · `packages/planner/src/task-policy` |
| Per-attempt telemetry, nested budgets user→run→task (Slice 7b)  | done  | `apps/orchestrator/src/budget/nest-budgets.ts`                      |
| Capability → model registry (D31)                                | done  | `packages/agent-core/src/capability/registry.ts`                    |
| Follow-up scope classifier (cosmetic / sub-DAG / architecture) (Slice 8) | done  | `packages/planner/src/follow-up`                               |
| Plan panel, blueprint panel (raw JSON), question flow (Slice 9) | done  | `apps/web/src/features/plan/components`                             |
| Blueprint content generation (LLM: entities/pages/features/theme) | done  | `packages/planner/src/content` · `apps/api/src/blueprint/generate-content-llm.ts` |
| Live wiring: prompt → intent → architecture → content → `planBlueprint()` → persisted `Blueprint`/`Task` rows (D73) | done | `POST /sessions/:sessionId/blueprint` — `apps/api/src/routes/blueprint.ts`, `apps/api/src/blueprint` |
| Task execution wired to a persisted Blueprint: real `TaskGenerator` (`runAgentLoop` scoped to a task's write-fence, cost tracked from `usage` events) + real `WorkspaceVerifier` (`@repo/verify`), fired after the route above persists (D74) | done — unverified against a real provider, see below | `apps/api/src/blueprint/{run-task-generator,execute-blueprint-run,start-run}.ts` |
| Out-of-credits gate on the blueprint route (binary, not a cents conversion — see D74's honesty note) | done | `apps/api/src/routes/blueprint.ts` |
| Cancel a running blueprint build (`activeBlueprintRuns` map + `POST /v1/runs/:runId/stop`) | done | `apps/api/src/blueprint/active-runs.ts`, `apps/api/src/routes/plan.ts` |
| `GET /v1/blueprints/:id`, `/v1/runs/:id`, `/v1/runs/:id/plan`, `/v1/runs/:id/tasks/:id/attempts`, `/v1/sessions/:id/blueprint-run` — the routes the pre-built plan/blueprint UI (Slice 9) was already written against but that never existed until now | done | `apps/api/src/routes/plan.ts` |
| Plan tab wired into the workspace: prompt → build → poll → stop, using the Slice 9 `PlanPanel`/`BlueprintPanel` that were built but never mounted anywhere | done | `apps/web/src/features/plan/components/{PlanTab,BlueprintPrompt,BlueprintRunView}.tsx`, new `"plan"` entry in `WORKSPACE_TABS` |
| `PlanValidator` allowlisted-package check                       | done  | `packages/planner/src/blueprint/validate-packages.ts`, `packages/contracts/deps.allow.json` |
| Design/layout/responsive blueprint blocks + validator (Slice 1b) | done  | `packages/contracts/src/blueprint.schema.ts`, `packages/ui-system/src/{validator,rules,layouts,visual-reference}` |
| Design review directions before generation (Slice 3b)           | done  | `packages/contracts/src/design-direction.schema.ts`, `packages/planner/src/directions`, `apps/web/src/features/plan/components/DesignReviewDirections.tsx` |
| UI task DAG + Component graph from AST (Slice 4c)                | done  | `packages/planner/src/compile/drafts.ts`, `packages/ui-system/src/ast` |
| Lazy sandbox boot, "Waking up your project…" state (Slice 8)    | done  | `apps/api/src/routes/session.ts`, `apps/web/src/features/preview/components/{PreviewPane,PreviewLoadingState}.tsx` |
| Three-domain acceptance runs (Slice 10)                          | done  | `apps/api/test/v4-acceptance.test.ts`                             |


---

## Why this version exists

V0–V3 build **a coding agent**. V4 is what makes it **an app builder**.

The difference is not a bigger prompt. It is a **planner** that turns an ambiguous sentence into
a frozen architecture and an ordered task graph, so that:

| Without a planner                                            | With a planner                                                   |
| ------------------------------------------------------------ | ---------------------------------------------------------------- |
| One giant prompt; the model improvises architecture mid-file | Architecture decided once, frozen, then referenced               |
| A spinner for three minutes                                  | A visible task list ticking off                                  |
| One failure kills the run                                    | One failure kills **one task**; retry that task                  |
| Cannot resume                                                | Task DAG state is in Postgres; resume from the last green node   |
| Unrepeatable                                                 | The plan is an artifact you can inspect, diff, cache, and replay |

**The thesis:** push intelligence _out_ of the LLM into deterministic engines. The LLM does
intent classification, a few clarifying questions, and app-specific code generation. Choosing a
stack, selecting components, composing the workspace, ordering tasks — that is **code**, not a
prompt. The DET:LLM ratio is the moat.

---

## Acceptance test

```
User: "Build me a food delivery app"

  ▸ Understanding your request…
  ? Should restaurants be able to sign up, or do you manage them?   → I manage them
  ? Do you need live order tracking?                                → yes

  ▸ Architecture           Next.js · Postgres · Prisma · Auth.js · Tailwind
  ▸ Plan (8 tasks)

    ✓ 1  Scaffold project + theme
    ✓ 2  Data model: restaurants, dishes, orders, users
    ✓ 3  Auth (email + session)
    ✓ 4  Restaurant list + detail pages
    ⟳ 5  Cart + checkout
      6  Order tracking
      7  Admin: manage restaurants
      8  Seed data + smoke tests

  ▸ Preview  https://preview-9f3a.<domain>
```

Then: _"make the cart sticky on mobile"_ → it re-plans **incrementally** (one small task), does
not rebuild the app, and the preview updates.

**Done means:** the generated app compiles, runs, has more than one working page, persists data,
and the plan was visible and accurate the whole time.

---

## Architecture

```
User prompt
     │
     ▼
┌─────────────────────────┐
│ Intent Understanding    │ LLM   {type, domain, users, complexity, features[]}
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ Requirement Engine      │ DET   feature flags → needs: auth? payments? realtime? admin?
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ Adaptive Questions      │ LLM   ask ONLY low-confidence items. Hard cap: 3.
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ Architecture Decision   │ DET   freeze the stack. Downstream may NOT override it.
└───────────┬─────────────┘
            ▼
╔═════════════════════════╗
║  BLUEPRINT  (JSON, IR)  ║  ◄── inspectable BEFORE any code is written
╚═══════════╤═════════════╝
            ▼
┌─────────────────────────┐
│ Task Graph Builder      │ DET   blueprint → ordered DAG with dependencies
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ Workspace Composer      │ DET   template + theme + blocks + deps  (NO AI yet)
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ Generation Agent        │ LLM   ONE task at a time, app-specific code only
└───────────┬─────────────┘      (this is the V0 loop, unchanged)
            ▼
┌─────────────────────────┐
│ Verification            │ DET   tsc → build → lint → test → runtime smoke
└───────────┬─────────────┘
            ▼
      Preview + review ──► follow-up ──► incremental re-plan
```

### The Blueprint is the contract

```jsonc
{
  "intent":  { "type": "marketplace", "domain": "food-delivery", "complexity": "medium" },
  "stack":   { "framework": "next", "db": "postgres", "orm": "prisma",
               "auth": "authjs", "styling": "tailwind" },       // FROZEN
  "entities": [
    { "name": "Restaurant", "fields": [...], "relations": ["Dish", "Order"] },
    { "name": "Order", "fields": [...] }
  ],
  "pages":   [ { "route": "/", "purpose": "browse restaurants", "components": [...] },
               { "route": "/r/[id]", "purpose": "menu + add to cart" } ],
  "features": ["auth", "cart", "order-tracking", "admin"],
  "theme":   { "preset": "clean-modern", "primary": "#e23744" }
}
```

Everything downstream **consumes** this. If the output is wrong, the fix is usually a planner
fix, not a generator fix — and you can tell which, because the blueprint is right there to read.

### Task DAG

```
              ┌──────────────┐
              │ T1 scaffold  │
              └──────┬───────┘
        ┌────────────┼────────────┐
        ▼            ▼            ▼
  ┌──────────┐ ┌──────────┐ ┌──────────┐
  │T2 schema │ │T3 theme  │ │T4 layout │   ← parallelisable
  └────┬─────┘ └────┬─────┘ └────┬─────┘
       ▼            │            │
  ┌──────────┐      │            │
  │T5 api    │      │            │
  └────┬─────┘      │            │
       └────────────┼────────────┘
                    ▼
             ┌─────────────┐
             │ T6 pages    │
             └──────┬──────┘
                    ▼
             ┌─────────────┐      ┌─────────────┐
             │ T7 auth     │─────►│ T8 tests    │
             └─────────────┘      └─────────────┘
```

Each node: `{ id, type, title, dependsOn[], owns[], reads[], status, attempts, riskTier,
capability, blueprintVersion, verification }`. Persisted → a crash resumes at the first non-green
node instead of restarting from zero.

**`dependsOn` is computed, not authored** — `reads` ∩ another task's `owns` is the edge
([D30](../DECISIONS.md#decision-30-a-task-declares-what-it-owns-and-what-it-reads--and-that-declaration-is-the-graph--active-target-v4)).
Overlapping `owns` means the two tasks are serialised; there is no merge stage.

---

## Build order — revised 2026-08-13

The slices below are the _inventory_ of V4. This is the **order**, and it is deliberately the
inverse of where design energy naturally goes. Scheduling and routing are last because **neither
can be evaluated without measurements you only get by running the steps above them.**

```
0  ONE task executes and verifies green            ← nothing else matters until this works
1  Run · Task · TaskAttempt tables + the failure path          D35
2  owns/reads → computed graph → PlanValidator → scheduler     D30 · D37 · D39
3  Risk-based verification: floors, never ceilings             D32
4  Deterministic context builder, with a token budget          D33 · O8
5  Per-attempt cost + token telemetry                          prerequisite for 7
6  Budgets: user → run → task                                  D38
7  TWO agents in parallel, measured against a serial control   D36
8  Model routing by capability                                 D31
9  Adaptive planning depth
10 Priority ordering
```

**Three rules that come out of that order:**

- **Parallelism multiplies whatever quality verification produces — including negative quality.**
  One agent writing bad code is one red task. Three agents writing bad code is a debugging problem
  with no isolated cause. Step 6 comes after step 3 for that reason alone.
- **Step 6 needs a control.** Run the same blueprint serially first and record wall-clock, token
  cost, and rework rate. Then run it with two agents. "Does parallelism help?" is otherwise
  unanswerable, and it will get shipped because it _felt_ faster.
- **Priority ordering barely matters below ~4 workers.** With 8–15 tasks and 2 agents, almost
  everything ready is scheduled immediately. Start with **one** metric — transitive dependent count
  — and only add more after watching the scheduler pick wrong.

**Rejected during this planning** (see [DECISIONS.md](../DECISIONS.md)): a `.project/*.json` state
directory in the generated repo · an LLM context synthesiser · a parallel-write integrator with a
merge stage · five-dimensional priority scoring. Critical-path scoring in particular needs **per-task
duration estimates that do not exist** — without them it degrades into longest-chain-by-node-count.

---

## TODO

### Slice 1 — Blueprint schema

- [x] Define it in `packages/contracts` as a Zod schema. **This is the most important artifact in
      V4** — everything else consumes it, so design it before writing any planner code.
- [x] Version the schema (`blueprintVersion`) from day one; it will change.
- [x] Persist blueprints (`Blueprint` table, one per session, immutable + revisions).
- [x] A blueprint viewer in the UI — a user should be able to read the plan before code exists.
      `BlueprintPanel.tsx` renders the raw JSON; no readable-summary view yet.

### Slice 1b — The UI system: enforcement and the design block

> **`packages/ui-system` already exists from [V1.1](./V1_1_UI_SYSTEM.md)** — tokens, registry, and
> both templates wired to it. V4 does **not** rebuild it. V4 gives it consequences: a vocabulary
> becomes a grammar that can reject
> ([D46](../DECISIONS.md#decision-46-the-ui-system-is-a-registry-and-a-token-scale-and-the-agent-composes-from-it--active-target-v11-enforced-at-v4)).

- [x] Extend `layouts/` and `rules/` (accessibility · responsive) — the two directories V1.1 left
      as stubs because nothing consumed them yet.
- [x] Add `design`, `layout`, and `responsive` blocks to the Blueprint schema
      ([D47](../DECISIONS.md#decision-47-the-blueprint-has-a-design-section-and-it-is-the-source-of-truth-for-visual-decisions--active-target-v4)).
      **Responsive is declared here, not fixed later** — desktop-first with a mobile cleanup pass
      means every session ends with the task nobody verifies.
- [x] A **validator**, not a prompt instruction: an off-scale value or an unregistered component
      fails the task. [D46](../DECISIONS.md#decision-46-the-ui-system-is-a-registry-and-a-token-scale-and-the-agent-composes-from-it--active-target-v11-enforced-at-v4)
      is only worth its cost if something enforces it.
- [x] Record raw-value escapes rather than forbidding them outright — three occurrences of the same
      raw value is a missing token, and the system should say so ([O23](../DECISIONS.md#open--not-yet-decided)).
- [x] Visual reference input: image → **parsed once** into the design block, never re-sent in
      context ([D52](../DECISIONS.md#decision-52-a-visual-reference-is-compiled-to-structure-once-never-re-shown-to-the-model--active-target-v4)).

### Slice 3b — Design review before generation

- [x] Emit the `design` block plus **2–3 directions** and let the user pick one
      ([D53](../DECISIONS.md#decision-53-the-design-is-reviewed-before-it-is-built--active-target-v4)).
- [x] Directions are **descriptions and a preview, not three generated applications** — building
      three to discard two costs three times the thing this exists to save.
- [x] Skippable, with the default visible. Same discipline as the 3-question cap in Slice 2: a
      decision in front of the magic moment must never be mandatory.
- [x] Open: how many directions, and what a preview _is_ before code exists ([O21](../DECISIONS.md#open--not-yet-decided)).

### Slice 4c — The UI task DAG and the component graph

- [x] UI-shaped task types: design system → app shell → typography → layout → shared components →
      pages → responsive → visual verification. Edges still computed from `owns`/`reads`
      ([D30](../DECISIONS.md#decision-30-a-task-declares-what-it-owns-and-what-it-reads--and-that-declaration-is-the-graph--active-target-v4)) — nothing new is invented for UI.
- [x] Build the `Component` graph from the **AST** at generation time, not by asking the model what
      it wrote. Rebuild after any task that touches a component file — **a stale graph is what makes
      V4.5 map a click to the wrong file.**

### Slice 2 — Intent + requirements

- [x] Intent classifier: prompt → structured JSON. **Use structured output / tool-calling, never
      "return JSON" in prose.** `packages/planner/src/intent/classify-intent.ts`.
- [x] Requirement engine (deterministic): map intent + feature keywords → concrete needs
      (auth, payments, realtime, admin, search, file upload). `detectNeeds()`.
- [x] Confidence scoring: mark low-confidence inferences as question candidates
      (explicit 0.95 · default 0.8 · inferred 0.6; question threshold 0.7).
- [x] Adaptive questions: ask **at most 3**, only about low-confidence, high-impact items.
      Every extra question is a user who leaves. `selectQuestions()`, ordered by impact.
- [x] Sensible defaults for everything unasked — and show them, so the user can correct them.
      Each question carries `defaultAnswer`; `applyAnswers()` returns new needs, never mutates.

### Slice 3 — Architecture decision engine

- [x] Deterministic rules: `needs.realtime → websockets`; `needs.payments → stripe`;
      `needs.fileUpload → local-uploads`; `needs.search → postgres-fulltext`. Rules, not vibes.
      `entities > 3 → postgres + prisma` is moot while the stack is one literal.
- [x] Once decided, the stack is **frozen** (`Object.freeze`, `decideArchitecture()`).
      Injecting it into downstream prompts waits for the generation agent (Slice 6).
- [x] Start with **one** stack (Next.js + Prisma + Postgres + Tailwind). One stack done well
      beats five done badly, and it makes the templates tractable. `FIXED_STACK` in
      `packages/planner/src/architecture/decide.ts`.

### Slice 4 — Task graph builder

- [x] Blueprint → tasks. Deterministic mapping: entities → a schema task; pages → page tasks;
      features → feature tasks.
- [x] **Each task declares `owns` and `reads`** ([D30](../DECISIONS.md#decision-30-a-task-declares-what-it-owns-and-what-it-reads--and-that-declaration-is-the-graph--active-target-v4)).
      This is the planner's job — and a far more checkable one than "list the dependencies in prose".
- [x] **Compute the edges: `reads` ∩ another task's `owns` ⇒ `dependsOn`.** The DAG is derived, not
      authored. A cycle then points at the exact two declarations that caused it.
- [x] **Three tables, not one** ([D35](../DECISIONS.md#decision-35-plan-and-execution-are-separate-tables--run-task-taskattempt--active-target-v4)):
      `Task` is the plan · `TaskAttempt` is one execution · `Run` is one pass of the executor.
      All telemetry — model, cost, tokens, duration, error, `commitSha` — lives on the **attempt**.
      `Task.status` is a roll-up written in the same transaction; the attempt is the source of truth.
      This absorbs V6's `HealAttempt` — a heal is an attempt, not a second table.
- [x] `Task` table: `status` · `dependsOn` · `owns` · `reads` · **`riskTier`**
      ([D32](../DECISIONS.md#decision-32-risk-is-its-own-axis-and-it-can-only-raise-the-bar--active-target-v4)) ·
      **`capability`** ([D31](../DECISIONS.md#decision-31-tasks-request-a-capability-never-a-model-name--active-target-v4)) ·
      **`blueprintVersion`** ([D34](../DECISIONS.md#decision-34-architecture-change-requests--the-frozen-stack-is-unfrozen-only-by-the-planner--active-target-v4-closes-o6)).
      `capability` and `riskTier` ship in the schema even while unused — adding them later means
      migrating every persisted task, the `seq` argument in a different costume.
- [x] **Canonicalise `owns`/`reads` before accepting the graph**
      ([D37](../DECISIONS.md#decision-37-ownership-is-normalised-and-covers-more-than-files--active-target-v4-closes-o9)):
      `normalise → expand → canonicalise → overlap`. `src/**` and `src/auth/**` are **not** equal as
      strings and **are** an overlap. Share the normaliser with `safeResolve` — one implementation.
- [x] **Ownership covers non-file resources too**: `db:app` · `port:3000` · `prisma:app.prisma` ·
      `env:*`. The DAG says a schema task and a seed task are independent; they both need the
      project's one database ([D15](../DECISIONS.md#decision-15-the-generated-apps-database--one-per-project--active-target-v4))
      and running concurrently corrupts it. File-only ownership is a fence with a gate left open.
      `packages/planner/src/ownership/overlap.ts` treats non-`/` declarations as an exact-identifier
      match (no sub-path containment).
- [x] **`PlanValidator` — two stages, before persistence**
      ([D39](../DECISIONS.md#decision-39-plan-validation-is-a-gate-never-a-repair--active-target-v4)):
      `Blueprint → BlueprintValidator → TaskCompiler → TaskGraphValidator → persist`.
      Checks: schema + version · supported stack · allowlisted packages · entities and routes
      well-formed · no cycles · no dangling `dependsOn` · no ownership overlap · every task has
      `capability`, `riskTier`, and a verification policy · task count under limit ·
      **estimated cost under the run budget** — all enforced in `packages/planner/src/{blueprint,validate}`
      including allowlisted packages in `validate-packages.ts` and `packages/contracts/deps.allow.json`.
- [ ] **Never repair an invalid plan with an LLM.** Reject and re-plan, bounded by a re-plan attempt
      limit. A model asked to fix its own cyclic graph produces a graph that passes and means
      something else — the failure moves from loud at plan time to silent at task 9.
      `planBlueprint()` never repairs, but no re-plan attempt limit exists yet.
- [x] Topological sort; identify parallelisable levels.
- [x] **Dispatch needs five gates, not one**
      ([D36](../DECISIONS.md#decision-36-dependencies-make-a-task-eligible-not-runnable--and-the-scheduler-is-not-the-orchestrator--active-target-v4)):
      dependencies green · no ownership conflict · no exclusive-resource conflict · capacity free ·
      budget remaining. **Overlapping `owns` ⇒ serialise** — one runs, the other waits. There is no
      merge stage and no integrator (D30). `apps/orchestrator/src/scheduler/{gates,schedule}.ts`.
- [x] **A waiting task must report _why_ it waits** ("blocked on T3" vs "waiting on capacity"), or a
      stalled build is indistinguishable from a hang. `WaitReason` union in
      `apps/orchestrator/src/scheduler/types.ts` and `describe-wait.ts`.
- [x] **Split Scheduler from Orchestrator** — separate modules in `apps/orchestrator`.
      Orchestrator owns the run lifecycle (start · pause · resume · cancel · retry · reporting);
      Scheduler owns what runs next. A scheduler bug wastes time; an orchestrator bug loses a run.
      `apps/orchestrator/src/{scheduler,dispatcher,executor}`.
- [x] **The write fence is narrowed per task to its `owns` glob** — enforced in the tool layer, not
      by the scheduler. The scheduler prevents _conflicts_; the fence prevents _violations_.
      `packages/planner/src/write-fence` + `apps/orchestrator/src/executor/postgres/fenced-attempt.ts`.
- [x] On task failure: retry ≤N with the error in context, then mark blocked and continue with
      any tasks that don't depend on it. Report partial completion honestly. **This is the main
      path, not the edge case** — rework rate dominates wall-clock time.
- [x] Task status persisted, so a crash resumes at the first non-green node
      ([D17](../DECISIONS.md#decision-17-recovery-model--git-is-the-checkpoint--active-target-v3)).
      Never cache a derived view of it anywhere else
      ([D33](../DECISIONS.md#decision-33-machine-state-lives-in-postgres-and-context-is-assembled-not-generated--active-target-v4)).
      `apps/orchestrator/src/executor/postgres/prisma-run-store.ts`.

### Slice 4b — Architecture Change Requests

- [x] An agent blocked by the frozen stack raises an **ACR** — `{ task, wanted, why, blocks }` —
      and does **not** improvise ([D34](../DECISIONS.md#decision-34-architecture-change-requests--the-frozen-stack-is-unfrozen-only-by-the-planner--active-target-v4-closes-o6)).
      `packages/planner/src/change-request/types.ts`.
- [x] Planner reviews. Reject → the task fails with a real reason. Approve → `blueprintVersion++`,
      diff, recompute **only** affected tasks. `review-change-request.ts` + `diff-tasks.ts`.
- [x] A change to the _stack_ requires user confirmation before anything runs.
      `needs_confirmation` status + `ChangeRequestNotice.tsx`.
- [x] An unanswered ACR marks the task `blocked`; independent tasks keep going.

### Slice 5 — Workspace composer (deterministic, no AI)

- [x] Compute theme CSS + the dependency list deterministically from the blueprint, as a pure
      `ComposePlan` — `packages/workspace/src/compose/plan.ts`. Tested in isolation
      (`packages/workspace/test/compose.test.ts`).
- [x] Copy the stack template into the workspace (`apps/api/src/workspace/manager.ts`).
- [x] Apply the computed theme CSS and install the computed dependencies — wire `ComposePlan`'s
      I/O half via `applyComposition()` (`packages/workspace/src/compose/apply.ts`, called from `apps/api/src/routes/blueprint.ts`).
- [ ] _(Optional, from `ROADMAP.md`'s registry design)_ a small **component registry**: 3–5 blocks
      (auth, sidebar, dashboard/stats, table) copied in deterministically. Do **not** attempt 400
      blocks. The registry is a large authoring burden — validate the loop before paying it.

### Slice 6 — Generation agent, narrowed

- [ ] Each task gets its **own** agent run with a tight, task-scoped prompt. The executor calls a
      `TaskGenerator` port (`apps/orchestrator/src/executor/postgres/types.ts`) — **no concrete
      implementation wires it to a real coding-agent run yet**, only the interface and the fenced
      wrapper around it (`fenced-attempt.ts`).
- [x] **Context is assembled, never generated** ([D33](../DECISIONS.md#decision-33-machine-state-lives-in-postgres-and-context-is-assembled-not-generated--active-target-v4)):
      frozen stack + relevant entities + the recorded outputs of `dependsOn` tasks + the files in
      `owns` and `reads`. String concatenation, not a summarising model call. **Not** the entire repo.
      `packages/planner/src/context/assemble-context.ts`.
- [x] _Batch by execution, retrieve by dependency_ — a task depending on one that ran 30 nodes ago
      still gets that node's output, because `dependsOn` says so.
- [x] **Token budget on the assembled context, with a documented drop order** ([O8](../DECISIONS.md#open--not-yet-decided)).
      Deterministic assembly cannot compress; without a cap, a wide `reads` list is dollars per task.
      `packages/planner/src/context/{bytes,constants}.ts`.
- [x] **Write fence narrowed to the task's `owns` glob**, enforced in the tool layer via
      `safeResolve`, not by asking the model nicely (D30). `fenced-attempt.ts` rejects any write
      outside `owns` before the attempt counts as completed.
- [ ] Prefer `edit_file` over `write_file` on existing files, so the agent amends rather than
      obliterates. (Depends on the real generator implementation above landing first.)
- [x] Model selected by `capability` through the registry — **only after Slice 7b exists**
      ([D31](../DECISIONS.md#decision-31-tasks-request-a-capability-never-a-model-name--active-target-v4)).
      `packages/agent-core/src/capability/registry.ts`.

### Slice 7 — Verification per task, floored by risk

- [x] Reuse `packages/verify` from V2, now run **after every task**. The executor calls
      `ports.verifyTask` after every `completed` attempt before marking it green
      (`apps/orchestrator/src/executor/run-task.ts`'s `verifyOutcome`).
- [x] `riskTier` → verification **tier** (1/2/3) is computed deterministically
      (`verificationFor()` in `packages/planner/src/task-policy/policy.ts`) —
      ([D32](../DECISIONS.md#decision-32-risk-is-its-own-axis-and-it-can-only-raise-the-bar--active-target-v4)):

```
every task    tier 1   tsc · prisma validate · lint          ← never skipped
medium        + tier 2  build · migrate · boot · GET /
high          + tier 3  interact + security checks           (tier 3 lands at V5)
```

  The orchestrator's `WorkspaceVerifier` is still a plain injected function
  (`apps/orchestrator/src/executor/verifier/workspace-verifier.ts`) — **it does not yet read the
  task's tier and select which checks to run**; wiring that selection is the remaining gap.
- [x] `riskTier` comes from **task type** — `schema`/`auth`/`payment`/`migration` are high — not
      from a model scoring itself. The planner may override upward only.
- [ ] Add a runtime smoke check: boot the dev server, hit the routes the task created, assert 200.
- [x] A task is not green until it verifies green. A red task never unblocks its dependents
      (`verifyOutcome` turns a failed verdict into a `failed` outcome; the scheduler's dependency
      gate only treats `done` as satisfied).

### Slice 7b — Per-attempt telemetry and nested budgets

- [x] Record model, tokens in/out, dollars, wall-clock, error, and `commitSha` **per `TaskAttempt`**
      ([D35](../DECISIONS.md#decision-35-plan-and-execution-are-separate-tables--run-task-taskattempt--active-target-v4)) —
      not per task, or attempt 3 erases what attempts 1 and 2 taught you.
      `apps/orchestrator/src/executor/postgres/mappers.ts` + `prisma-run-store.ts`.
- [x] **Budgets nest: user → run → task**
      ([D38](../DECISIONS.md#decision-38-budgets-nest--user--run--task--active-target-v4)).
      The innermost level is D26's loop `Budget`, which already exists. A task exceeding it returns
      `budgetExceeded`; the **run** then decides whether to continue with independent tasks or stop.
      `apps/orchestrator/src/budget/nest-budgets.ts`.
- [ ] Re-calibrate the budget defaults from real attempt telemetry. The first numbers are estimates
      and will be wrong in both directions.
- [ ] **This gates Slice 6's model routing and the parallelism experiment.** Both make a claim about
      cost and speed. Without the numbers, neither claim can be falsified and tuning either one is
      superstition.

### Slice 8 — Incremental re-planning

Full flow in [D18](../DECISIONS.md#decision-18-the-returning-user-flow--active-target-v4).

- [x] **Boot the sandbox lazily** — opening a project reads from Postgres and git and costs nothing.
      Only a message provisions. Show an explicit "Waking up your project…" state; a cold restore
      is 30–90s and pretending otherwise makes it feel broken.
      `apps/api/src/routes/session.ts`, `apps/web/src/features/preview/components/PreviewLoadingState.tsx`.
- [x] Follow-ups go to the **planner**, not straight to the raw agent.
      `packages/planner/src/follow-up/scope-follow-up.ts`.
- [x] Classify: cosmetic tweak → a single task; new feature → a sub-DAG; architecture change →
      confirm with the user first, because it invalidates the frozen stack. `scopeFollowUp()`
      returns `"cosmetic" | "feature" | "architecture"`, the last with `requiresConfirmation: true`.
- [x] Never re-run the whole DAG for _"make the button blue"_ — `scopeFollowUp()` returns only the
      `affectedTaskIds`/`newTaskIds`/`untouchedTaskIds` diff via `diffAffectedTaskIds()`.

### Slice 9 — UI

- [x] Plan panel: the task list, live status per task, expandable to that task's agent transcript.
      `PlanPanel.tsx` + `TaskRow.tsx` + `TaskTranscript.tsx`.
- [x] Blueprint panel: raw JSON view. `BlueprintPanel.tsx` — no readable architecture *summary*
      yet, only the JSON, so this is partial.
- [x] Question flow: inline bubbles, not a modal. `components/question-flow/QuestionFlow.tsx`.
- [x] Progress that reflects reality (`4/8 tasks`), not a fake percentage bar.
      `features/plan/lib/progress.ts`'s `summarizeProgress()`.

### Slice 10 — Prove it

- [x] Three different prompts across three domains (food delivery / CRM / blog). All three produce
      apps that compile, run, and have working navigation and persisted data.
      `apps/api/test/v4-acceptance.test.ts`.
- [x] The follow-up test: _"make the cart sticky"_ re-plans incrementally.
- [x] Kill the worker mid-DAG → resume picks up at the first non-green task, not task 1.

---

## Files this version touches

```
NEW  packages/planner/src/intent.ts        LLM classification
NEW  packages/planner/src/requirements.ts  DET
NEW  packages/planner/src/architecture.ts  DET, frozen decisions
NEW  packages/planner/src/blueprint.ts     schema + builder
NEW  packages/planner/src/taskGraph.ts     owns/reads → edges + topo sort + validation   D30
NEW  packages/planner/src/context.ts       deterministic context assembly, budgeted      D33 · O8
NEW  packages/planner/src/risk.ts          task type → riskTier → verification floor     D32
NEW  packages/planner/src/changeRequest.ts ACR review + blueprint versioning             D34
NEW  packages/agent-core/src/models/registry.ts   capability → model. The only model ids D31
NEW  packages/composer/src/*               deterministic workspace assembly
NEW  templates/registry/                    (optional) component blocks
EDIT packages/db/prisma/schema.prisma      Blueprint, Task, ChangeRequest (see ARCHITECTURE §11)
EDIT apps/orchestrator/src/*               DAG executor
EDIT apps/web/src/*                        plan panel, blueprint panel, question flow
```

---

## Traps

| Trap                                  | Symptom                                                  | Fix                                                                                                                                                                                       |
| ------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Blueprint schema designed late        | Every component parses a different shape                 | Design the IR first                                                                                                                                                                       |
| Too many clarifying questions         | Users abandon at question 4                              | Cap at 3; default the rest visibly                                                                                                                                                        |
| Stack decided per task                | Task 3 uses Prisma, task 6 invents Drizzle               | Freeze it; inject into every prompt                                                                                                                                                       |
| Whole-repo context per task           | $4 per task and a confused model                         | Task-scoped context only                                                                                                                                                                  |
| No write fence                        | Task 7 rewrites task 2's schema                          | Allowlist in the tool layer                                                                                                                                                               |
| Full re-plan on follow-ups            | 3 minutes to change a color                              | Classify the follow-up first                                                                                                                                                              |
| Registry-first                        | Weeks authoring blocks before the loop is proven         | Prove the loop, then add blocks                                                                                                                                                           |
| Optimistic task status                | Green tasks that don't compile                           | Green requires a verification pass                                                                                                                                                        |
| **Parallelism before verification**   | Three agents' broken work merged, no isolated cause      | Verify at the task boundary. Parallelism multiplies whatever quality verification produces                                                                                                |
| **Ownership too broad**               | `owns: ["src/**"]` — the whole build silently serialises | Warn on a task claiming most of the tree ([O9](../DECISIONS.md#open--not-yet-decided))                                                                                                    |
| **Risk as a ceiling**                 | One bad guess skips verification on the payment task     | Risk adds tiers, never removes them ([D32](../DECISIONS.md#decision-32-risk-is-its-own-axis-and-it-can-only-raise-the-bar--active-target-v4))                                             |
| **Routing without telemetry**         | A model policy nobody can prove helped or hurt           | Per-task cost first (Slice 7b), routing second                                                                                                                                            |
| **Agent state in the generated repo** | The user downloads their app and finds `errors.json`     | Postgres holds the plan; the repo holds the app ([D33](../DECISIONS.md#decision-33-machine-state-lives-in-postgres-and-context-is-assembled-not-generated--active-target-v4))             |
| **Silent stack improvisation**        | Task 3 uses Prisma, task 6 invents Drizzle               | An ACR is a visible event with a decision ([D34](../DECISIONS.md#decision-34-architecture-change-requests--the-frozen-stack-is-unfrozen-only-by-the-planner--active-target-v4-closes-o6)) |
| **Telemetry on `Task`**               | Attempt 3 overwrites what attempts 1–2 taught you        | It belongs on `TaskAttempt` ([D35](../DECISIONS.md#decision-35-plan-and-execution-are-separate-tables--run-task-taskattempt--active-target-v4))                                           |
| **Ownership compared as strings**     | `src/**` and `src/auth/**` both dispatch; they overlap   | Canonicalise before the overlap check ([D37](../DECISIONS.md#decision-37-ownership-is-normalised-and-covers-more-than-files--active-target-v4-closes-o9))                                 |
| **File-only ownership**               | Two "independent" tasks migrate the one database at once | Resources are owned too — `db:app`, `port:3000`                                                                                                                                           |
| **LLM repairs an invalid plan**       | The graph passes validation and means something else     | Reject and re-plan ([D39](../DECISIONS.md#decision-39-plan-validation-is-a-gate-never-a-repair--active-target-v4))                                                                        |
| **A silently waiting task**           | A stalled build looks identical to a hang                | The scheduler reports why each waiting task waits                                                                                                                                         |

---

## Concepts to learn here

Planner/executor separation · IR design · DAG scheduling · structured LLM output · prompt
scoping & context budgets · determinism boundaries · progressive disclosure in UX.
See [LEARNING.md → V4](../LEARNING.md#v4--planning-systems).

---

## Settled: full-stack ([D14](../DECISIONS.md#decision-14-the-generator-produces-full-stack-apps--active-target-v4-closes-o1))

Appwright generates **Next.js + Prisma + Postgres + Auth.js + API routes + migrations + seed data**.
Not frontend-only with mock data. Everything below assumes that.

### What full-stack adds, over frontend-only

|                          | Extra work                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Template**             | `templates/nextjs-fullstack` — hand-built, committed, and **working before any AI runs**                      |
| **Database per project** | Postgres inside each sandbox. Dev/prod parity beats fast boot                                                 |
| **Task types**           | schema · API route · page · auth · seed — each with its own context and verification                          |
| **Migrations**           | deterministic step: agent writes `schema.prisma` → executor runs `prisma migrate dev` → failure is a red task |
| **Verification**         | `prisma validate` → migrate → `tsc` → build → boot → hit routes → auth flow                                   |
| **Env injection**        | `DATABASE_URL`, `AUTH_SECRET` generated at provision time. Never in LLM context                               |
| **Managed Data & Auth**  | MongoDB database per project + Redis 6+ ACLs + Appwright Auth Gateway ([D61](../DECISIONS.md))                  |

### The rule that makes it tractable

**The more that ships in the template, the less the LLM can break.**

| Template — deterministic, never generated           | Generated — app-specific only |
| --------------------------------------------------- | ----------------------------- |
| Next.js config, Tailwind, tsconfig, ESLint          | pages and components          |
| **Auth.js wiring** — callbacks, session, middleware | the Prisma models             |
| Prisma client singleton, `DATABASE_URL` plumbing    | API route handlers            |
| Base layout, error boundary, loading states         | seed data                     |
| The migration and seed scripts themselves           |                               |

Auth is fiddly and near-identical in every app. Generating it from scratch is a pure downside —
the agent adds _models and routes_, it does not invent session handling.

### Build order — Slice 0 comes before everything

```
0. Hand-build templates/nextjs-fullstack and commit it   ← NO AI
1. Blueprint schema, including `entities`
2. Schema task ONLY:  entities → schema.prisma → migrate → verify
3. API route tasks
4. Page tasks
5. Auth (mostly template injection)
6. Seed data task
```

**Slice 0 is non-negotiable and easy to skip.** If the baseline template does not boot, log in, and
query the database **by hand**, no amount of generation will fix it — you will be debugging the
planner and the template simultaneously, with no way to tell which is wrong.

**Every bug the template can eliminate is a bug class the agent cannot introduce.** Hunt these
while hand-building it, because each one otherwise repeats in every generated app forever:

| Trap                                   | Why it bites here                                                                                                                                                                           | Template's answer                                                                                                                       |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **`Decimal` for money**                | Prisma's `Decimal` is a Decimal.js object; Next.js cannot serialise it across the Server → Client Component boundary. **Every e-commerce app has a product page**, so this fires on app one | `priceCents Int` — `4999` is `$49.99`. Verify against the Prisma version pinned here                                                    |
| `Date` across the same boundary        | The same serialisation class of bug, quieter                                                                                                                                                | Decide the convention once, in the template                                                                                             |
| Prisma client instantiated per request | Connection exhaustion under any real traffic                                                                                                                                                | Singleton ships in the template ([D14](../DECISIONS.md#decision-14-the-generator-produces-full-stack-apps--active-target-v4-closes-o1)) |

The point is not these three. It is the pass itself: **write a page that reads every field type the
schema can produce, and run it, before any AI runs.**

**Seed data is a task, not polish.** A generated app with empty tables looks broken. Seeded rows are
most of what makes a preview feel like a real application.

---

## Definition of done

- [ ] One sentence → a working, multi-page, data-persisting app.
- [ ] The plan is visible and accurate throughout.
- [ ] Every task verified green before its dependents run.
- [ ] Follow-ups re-plan incrementally.
- [ ] Three domains, three working apps.
