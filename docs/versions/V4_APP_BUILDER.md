# V4 — App Builder  ◄ Emergent parity

> **Goal:** one sentence in, a whole working application out — via a visible plan that executes
> task by task, each verified before the next begins.
>
> **Status:** 🔴 not started · **Est.** 4–6 weeks · **Depends on:** [V3](./V3_CLOUD_SANDBOX.md)

---

## Why this version exists

V0–V3 build **a coding agent**. V4 is what makes it **an app builder**.

The difference is not a bigger prompt. It is a **planner** that turns an ambiguous sentence into
a frozen architecture and an ordered task graph, so that:

| Without a planner | With a planner |
|---|---|
| One giant prompt; the model improvises architecture mid-file | Architecture decided once, frozen, then referenced |
| A spinner for three minutes | A visible task list ticking off |
| One failure kills the run | One failure kills **one task**; retry that task |
| Cannot resume | Task DAG state is in Postgres; resume from the last green node |
| Unrepeatable | The plan is an artifact you can inspect, diff, cache, and replay |

**The thesis:** push intelligence *out* of the LLM into deterministic engines. The LLM does
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

Then: *"make the cart sticky on mobile"* → it re-plans **incrementally** (one small task), does
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

Each node: `{ id, title, description, dependsOn[], status, filesTouched[], verification }`.
Persisted → a crash resumes at the first non-green node instead of restarting from zero.

---

## TODO

### Slice 1 — Blueprint schema
- [ ] Define it in `libs/ts/contracts` as a Zod schema. **This is the most important artifact in
      V4** — everything else consumes it, so design it before writing any planner code.
- [ ] Version the schema (`blueprintVersion`) from day one; it will change.
- [ ] Persist blueprints (`Blueprint` table, one per session, immutable + revisions).
- [ ] A blueprint viewer in the UI — a user should be able to read the plan before code exists.

### Slice 2 — Intent + requirements
- [ ] Intent classifier: prompt → structured JSON. **Use structured output / tool-calling, never
      "return JSON" in prose.**
- [ ] Requirement engine (deterministic): map intent + feature keywords → concrete needs
      (auth, payments, realtime, admin, search, file upload).
- [ ] Confidence scoring: mark low-confidence inferences as question candidates.
- [ ] Adaptive questions: ask **at most 3**, only about low-confidence, high-impact items.
      Every extra question is a user who leaves.
- [ ] Sensible defaults for everything unasked — and show them, so the user can correct them.

### Slice 3 — Architecture decision engine
- [ ] Deterministic rules: `needs.realtime → websockets`; `needs.payments → stripe`;
      `entities > 3 → postgres + prisma`. Rules, not vibes.
- [ ] Once decided, the stack is **frozen** and injected into every downstream prompt.
- [ ] Start with **one** stack (Next.js + Prisma + Postgres + Tailwind). One stack done well
      beats five done badly, and it makes the templates tractable.

### Slice 4 — Task graph builder
- [ ] Blueprint → DAG. Deterministic mapping: entities → a schema task; pages → page tasks;
      features → feature tasks.
- [ ] Topological sort; identify parallelisable levels.
- [ ] `Task` table with status + `dependsOn`.
- [ ] Executor: walk the DAG, run ready tasks (respecting concurrency limits), mark green/red.
- [ ] On task failure: retry ≤N with the error in context, then mark blocked and continue with
      any tasks that don't depend on it. Report partial completion honestly.

### Slice 5 — Workspace composer (deterministic, no AI)
- [ ] Copy the stack template into the sandbox.
- [ ] Apply theme tokens (colors, typography, radius, spacing) — tokens only, never generated JSX.
- [ ] Install dependencies implied by the blueprint.
- [ ] *(Optional, from `ROADMAP.md`'s registry design)* a small **component registry**: 3–5 blocks
      (auth, sidebar, dashboard/stats, table) copied in deterministically. Do **not** attempt 400
      blocks. The registry is a large authoring burden — validate the loop before paying it.

### Slice 6 — Generation agent, narrowed
- [ ] Each task gets its **own** agent run with a tight, task-scoped prompt.
- [ ] Context per task: blueprint + the files the task may touch + relevant existing code. **Not**
      the entire repo.
- [ ] **Write fence:** a task may only write files in its declared scope. Enforced in the tool
      layer (the `safeResolve` allowlist), not by asking the model nicely.
- [ ] Prefer `edit_file` over `write_file` on existing files, so the agent amends rather than
      obliterates.

### Slice 7 — Verification per task
- [ ] Reuse `libs/py/verify` from V2, now run **after every task**.
- [ ] Add a runtime smoke check: boot the dev server, hit the routes the task created, assert 200.
- [ ] A task is not green until it verifies green. A red task never unblocks its dependents.

### Slice 8 — Incremental re-planning
- [ ] Follow-ups go to the **planner**, not straight to the raw agent.
- [ ] Classify: cosmetic tweak → a single task; new feature → a sub-DAG; architecture change →
      confirm with the user first, because it invalidates the frozen stack.
- [ ] Never re-run the whole DAG for *"make the button blue"*.

### Slice 9 — UI
- [ ] Plan panel: the task list, live status per task, expandable to that task's agent transcript.
- [ ] Blueprint panel: readable architecture summary + the raw JSON behind a toggle.
- [ ] Question flow: inline in chat, not a modal.
- [ ] Progress that reflects reality (`4/8 tasks`), not a fake percentage bar.

### Slice 10 — Prove it
- [ ] Three different prompts across three domains (food delivery / CRM / blog). All three produce
      apps that compile, run, and have working navigation and persisted data.
- [ ] The follow-up test: *"make the cart sticky"* re-plans incrementally.
- [ ] Kill the worker mid-DAG → resume picks up at the first non-green task, not task 1.

---

## Files this version touches

```
NEW  libs/py/planner/src/intent.ts        LLM classification
NEW  libs/py/planner/src/requirements.ts  DET
NEW  libs/py/planner/src/architecture.ts  DET, frozen decisions
NEW  libs/py/planner/src/blueprint.ts     schema + builder
NEW  libs/py/planner/src/taskGraph.ts     DAG build + topo sort
NEW  libs/py/composer/src/*               deterministic workspace assembly
NEW  templates/registry/                    (optional) component blocks
EDIT libs/ts/db/prisma/schema.prisma      Blueprint, Task
EDIT services/orchestrator/src/*               DAG executor
EDIT services/web/src/*                        plan panel, blueprint panel, question flow
```

---

## Traps

| Trap | Symptom | Fix |
|---|---|---|
| Blueprint schema designed late | Every component parses a different shape | Design the IR first |
| Too many clarifying questions | Users abandon at question 4 | Cap at 3; default the rest visibly |
| Stack decided per task | Task 3 uses Prisma, task 6 invents Drizzle | Freeze it; inject into every prompt |
| Whole-repo context per task | $4 per task and a confused model | Task-scoped context only |
| No write fence | Task 7 rewrites task 2's schema | Allowlist in the tool layer |
| Full re-plan on follow-ups | 3 minutes to change a color | Classify the follow-up first |
| Registry-first | Weeks authoring blocks before the loop is proven | Prove the loop, then add blocks |
| Optimistic task status | Green tasks that don't compile | Green requires a verification pass |

---

## Concepts to learn here

Planner/executor separation · IR design · DAG scheduling · structured LLM output · prompt
scoping & context budgets · determinism boundaries · progressive disclosure in UX.
See [LEARNING_PATH.md → V4](../LEARNING_PATH.md#v4--planning-systems).

---

## Open decision, must be settled before starting

**Full-stack or frontend-only?**

The root [`ROADMAP.md`](../../ROADMAP.md) locks *"frontend-only, mock data layer in `src/data/`,
no Postgres/Prisma"* for its MVP. **Emergent is full-stack.** These are different products and the
choice determines how many generation agents exist, what the templates contain, and what
"verified" means.

*Recommendation:* frontend-only for the **first** blueprint→app loop (it is genuinely faster to
prove), then add a backend/database generation agent as V4.5 once the pipeline is real. But
**write the decision down in [DECISIONS.md](../DECISIONS.md) before Slice 1** — it silently
shapes every slice below it.

---

## Definition of done

- [ ] One sentence → a working, multi-page, data-persisting app.
- [ ] The plan is visible and accurate throughout.
- [ ] Every task verified green before its dependents run.
- [ ] Follow-ups re-plan incrementally.
- [ ] Three domains, three working apps.
