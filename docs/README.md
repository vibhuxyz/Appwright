# Appwright — docs

An AI app builder in the shape of Emergent/Lovable. One sentence in → a planner produces a frozen
architecture and a task list → a coding agent executes the tasks in an isolated sandbox → live
preview, review, iterate, deploy.

**Type `/start` to begin a session. Type `/wrap` to end one.** The docs are the memory.

**Identity ([D71](./DECISIONS.md), 2026-09-30):** an *AI developer execution/runtime laboratory*,
not a feature factory. The product is the vehicle; the subject is **how to safely execute
unreliable AI-generated plans** — isolate, recover, verify. A feature earns its place by enabling
an engineering experiment. Standard and definition-of-done: [ENGINEERING_STANDARD.md](./ENGINEERING_STANDARD.md);
what must always hold: [INVARIANTS.md](./INVARIANTS.md).

---

## Status

**Now:** V1.2 — done 2026-09-23, all 7 slices ([D64](./DECISIONS.md)–[D70](./DECISIONS.md)).
`POST /conversation` classifies every request into a `Decision` (intent/changeType/risk/route/
component/complexity/ambiguity) and actually branches on the resulting five-mode policy —
`"blocked"` never reaches the model, `"direct"` skips `planTasks()`. A live eval suite
(`bun run eval` in `packages/decision-engine`) reports 15/15 policy accuracy, 0 under-cautious,
against the real provider. Full history, including every deliberately-skipped piece and why
(cache, decision trace, provider health/fallback, a component family taxonomy, a Tier 2
requirement checker, the question-type union), is in
[versions/V1_2_DECISION_ENGINE.md](./versions/V1_2_DECISION_ENGINE.md) and D64–D70.
**Now:** V2 — isolation & control is implemented; acceptance run pending (see [V2 status](./versions/V2_ISOLATION_AND_CONTROL.md#implementation-status)). V2's approval
gate is the first real consumer of the `"review"` policy V1.2 built but never enforced.

- [x] **V0 — done.** Both acceptance tests pass against `templates/vite-react` with a real OpenAI provider.
- [x] **V1 — done 2026-08-16.** Postgres schema (Project/Session/Message), CRUD + conversation
      routes, SSE streaming with reconnect buffer, two-directory workspace model, dev-server
      manager, 3-pane web UI. Verified live in-browser: project create → prompt → tool calls stream
      → **hard refresh mid-run → full transcript recovered** → preview iframe shows the change.
      **Gap closed 2026-08-22:** cost/token tracking now populates. See V1.1 below.

- [x] **V1.1 — done 2026-08-22.** `packages/ui-system` — token scale, nine-primitive registry,
      shadcn/Radix/Lucide vendored once and emitted into both templates, registry injected into the
      system prompt. Acceptance test passed: same prompt on `vite-react` and `nextjs-fullstack`,
      both composed `Card`/`Button`/`Badge`, **zero arbitrary bracket values**, and the two
      previews read as one product. V1's dark-mode test re-run live and still passes — the toggle
      works by flipping one class, because `.dark` in the generated `tokens.css` redefines every
      semantic colour.
      **Also closed here:** V1's `$0.0000` gap. Real `usage` parsing → a priced `usage` event →
      an atomic `increment` on `Session` → a live SSE frame. Verified in-browser: a Gemini run
      moved the header to `$0.0550 · 41732↑ 281↓` while it ran. **`maxCostUsd` is reachable for
      the first time.**
      **Deleted:** `packages/ui` (`@repo/ui`), the Turborepo leftover — zero importers re-verified
      before removal.

- [x] Architecture extracted from the _Coding Agents + Cloud_ deck
- [x] V0–V6 ladder defined, each with one acceptance test
- [x] **TypeScript end to end** ([D4](./DECISIONS.md)) — the agent is a library, not a service
- [x] Repo restructured: `services/` + `libs/` + `docker/`, no task runner (superseded — see below)
- [x] Slice 0 — workspace scaffolded, `bun install` clean, API imports `@repo/agent-core`
- [x] **D22–D24 added** — HTTP sandbox contract · untrusted tool results · dependency allowlist
- [x] **D25 — E2B is the sandbox provider**, closing O1. Firecracker considered, deferred, with
      two written triggers that would reopen it
- [x] **D26–D29 added 2026-08-11** — six loop exits + a loop budget · the agent is a _client_ of a
      runtime, not a resident · `/workspace` is the only root · the environment is prepared before
      the agent starts. **Four of them land in `types.ts` and `runtime.ts` — V0, not later.**
      Rejected the same day: an agent-swapping abstraction and a multi-language runtime matrix,
      both premature before one loop exists
- [x] **D30–D34 added 2026-08-13** — task ownership declares the graph · capability-not-model-name ·
      risk as its own axis with verification _floors_ · state in Postgres, context assembled not
      generated · Architecture Change Requests, **closing O6**. V4's build order revised so
      scheduling and routing come last, behind the telemetry that makes them falsifiable.
      Rejected the same day: a `.project/` state directory, an LLM context synthesiser, a
      parallel-write integrator, and five-dimensional priority scoring
- [x] **D35–D40 added 2026-08-13** — plan vs execution (`Run` · `Task` · `TaskAttempt`) · five
      dispatch gates and **Orchestrator ≠ Scheduler** · normalised ownership over files _and_
      resources, **closing O9** · nested budgets user→run→task, which finally gives cost control a
      home · plan validation as a gate that never LLM-repairs · `RunEvent` as the execution log,
      distinct from `Message`. **`ARCHITECTURE.md` §11 had no `Blueprint` table at all** — the data
      model is now the eleven entities V4 actually needs. Deferred: a generic `Artifact` table (O11)
- [x] **D41–D43 added 2026-08-16** — deploy into the **user's own** Vercel + Postgres, connected at
      Deploy and never at build · `Environment` as an entity with two rows · **agent decides /
      executor runs / user authorises**, which is the standing test for "should this be a tool?"
      and closes the MCP question with no MCP decision. **O5 shrank to preview-time only** —
      deployed secrets are write-through and never stored. Rejected the same day: MCP as the
      integration backbone (contradicts [D24](./DECISIONS.md)), EC2 for the backend (contradicts
      [D25](./DECISIONS.md)), a `DeploymentProvider` interface before two implementations exist,
      and a mid-build pause to provision a database (contradicts [D29](./DECISIONS.md))
- [x] **D44–D45 added 2026-08-22**, from a latency and system-design review of the docs — **a
      restored checkpoint invalidates the transcript written after it** (a worker dying mid-task
      left Postgres describing 30 edits the git restore had already undone, and V3's
      `(sessionId, seq)` idempotency could never have caught it — a replay re-calls the LLM and
      gets different text, so there is no key to collide on) · **budgets are seat holds, not
      balance checks** — a run atomically reserves `budgetUsd` in the `WHERE` clause, because
      read-then-check lets N concurrent runs each pass the same test. D40 amended: **`text_delta`
      is never written to a row**, or `RunEvent` grows at token rate rather than event rate.
      **Eight open questions raised (O12–O19)** — `seq` allocation under two writers · what is
      inside a snapshot · a latency budget per version · LLM provider backpressure · tenant
      fairness · connection pooling · preview-URL auth · where the reconnect buffer lives once the
      API has two instances
- [x] **New rung: [V1.1 UI System](./versions/V1_1_UI_SYSTEM.md)** (2026-08-22). **D46's target
      moved V4 → V1.1**, split into _vocabulary now, enforcement at V4_. The trigger was felt, not
      predicted: V1 is shipped and its output reads as a first draft — and the taste-independent
      evidence is that the **pristine** `vite-react` starter already ships `rounded-[30px]`,
      `leading-[72px]`, and `text-[32px]` in hand-rolled `.btn`/`.head-text` utilities. The
      template was inventing off-scale values before the agent ever did. **Both templates share one
      token library** so two token files cannot become two design systems; recorded cost is two
      shadcn installs and `vite-react` possibly becoming dead weight at V4. Also found:
      **`packages/ui` (`@repo/ui`) is a Turborepo starter leftover with zero importers** — delete or
      rename it before `ui-system` lands, or §14's _two of everything_ blurs
- [x] **D46–D53 added 2026-08-22** — the UI system as a **registry + token scale** the agent
      composes from, never invents ([D9](./DECISIONS.md)'s determinism argument applied to pixels,
      [D24](./DECISIONS.md)'s allowlist shape applied to components) · a `design` block in the
      Blueprint, frozen like the stack, with **responsive declared not retrofitted** · **`DesignState`
      is a staging buffer, discarded on green** — a durable design layer would be
      [D44](./DECISIONS.md) in a new costume · **`data-aw-id` injected at dev-build time**, so the
      exported repo never contains a marker and there is no strip pass to forget · **exact edits
      never reach the model** (`width = 286px` is a codemod; _"feel more premium"_ is a prompt) ·
      **verification checks the request that was made**, not a quality score — and a UI score stays
      advisory and deterministic, because a model rating its own UI is [D32](./DECISIONS.md)'s
      refused mistake · references compiled to structure **once** · the design **reviewed before it
      is built**. **New rung: [V4.5 Visual Editor](./versions/V4_5_VISUAL_EDITOR.md)**, placed
      before V5 by the user against the recommendation to place it after V6 — the recorded cost and
      its mitigation are written into the version doc. Raised O20–O23: id stability · variant budget
      · visual-verification cost · the token-scale escape hatch
- [x] **D54, D56, D57 added 2026-09-15** — repo layout reversed to `apps/` + `packages/` +
      `infrastructure/`, Turborepo reintroduced (**supersedes [D11](./DECISIONS.md), [D12](./DECISIONS.md)** —
      explicitly, before either's own revisit trigger fired) · `packages/events` (Kafka) +
      `workers/{ingestion,indexing,evaluation,maintenance}`, gated behind
      `docker compose --profile events`, off by default · `packages/auth` split out of `apps/api`
      (auth primitives vs. Prisma-coupled ownership checks, now `apps/api/src/ownership.ts`).
      **This was a user-directed reversal, not an earned one** — D11's own honesty section says so
      explicitly; see `docs/DECISIONS.md` for the full trade-offs
- [x] **D55 added, then reversed same day by D58** — a full `inference/` model-serving platform
      (gateway, vLLM Dockerfiles, model manifests) was scaffolded and verified working, then
      **deleted on purpose**: the goal here is to learn these concepts by building them by hand,
      one version at a time, not start from an AI-generated platform. `docs/CRASH_COURSE.md`'s
      "Model gateway" card stays — taught, not built — for whichever future version actually earns
      it. **`packages/logger` and `packages/cache` are live**, wired into `apps/api` (request/error
      logging throughout, Redis-backed login rate limiting) — those survived because they're small,
      real, and already load-bearing, not because they were part of the same platform push
- [x] **D59, D60 added 2026-09-15** — **Durable Stop Reasons & Reactive Pause/Resume Cards (closing O7)**:
      Stop conditions (`budgetExceeded`, `cancelled`, `maxIterations`, `timeout`) persisted on `Message.data: { stopReason }`
      and streamed via SSE status frame. The UI shows color-coded pause cards with an instant `[ ⏵ Continue Building ]`
      resume button · **Dynamic Capability Registry**: removed hardcoded tool and primitive names from system prompts.
      Tools self-describe via `capabilityHint` and `describeTools()`, and `@repo/ui-system` feeds `uiSystemPromptSection()`,
      allowing prompt enhancement to adapt dynamically as new tools (e.g. Playwright) or UI primitives are registered.
- [x] **D62 added 2026-09-15** — **Multi-Stage Modal Authentication with Unified Root Routing (`/`) & Interactive Template Showcase**:
      Replaced standalone auth routes with an integrated modal dialog supporting three views (`welcome`, `email-signup`, `email-login`),
      developer OAuth providers (GitHub, Google, Microsoft), and work email credit bonus banner. Left column features an auto-cycling
      showcase of 4 real Appwright applications (AI SaaS Studio, FinTech Terminal, 3D Ecommerce, Food Delivery) with active progress bars.
      Unified application routing by intercepting `/dashboard` and cleanly redirecting to root `http://localhost:3000/`. Integrated user
      credit provisioning ($10.00 / 10M tokens) and responsive Upgrade modal.
- [x] **D61 added 2026-09-15** — **Multi-Tenant Managed Infrastructure (MongoDB, Redis, Auth Gateway)**:
      Single high-availability admin clusters partitioned into project-level databases (`db_proj_${id}`) with scoped users
      in MongoDB, Redis 6+ ACLs (`~p:${id}:*`, `-@dangerous`) for key isolation, and a centralized OAuth Proxy (`auth.appwright.com`)
      signing project JWTs with `AUTH_SECRET` for zero-friction Google/GitHub auth. Storage and request volume are metered
      asynchronously and charged against the user's unified credit balance. Deterministically injected into preview `.env`
      and written directly to Vercel production environment via Vercel Env API on deploy.
- [x] **`packages/cache`/`packages/logger` integrated into `apps/api`, 2026-09-15** — every
      `console.*` call replaced with structured logs (`method`/`path`/`status`/`ms` on every
      request); `/auth/login` rate-limited via a Redis `INCR`+`EXPIRE` counter, **fails open** if
      Redis is unreachable rather than locking out login over an auxiliary dependency
- [x] **New rung: [V1.2 Decision Engine](./versions/V1_2_DECISION_ENGINE.md)** (2026-09-22),
      scoped down from a much larger user-requested platform — see [D63](./DECISIONS.md). A new
      `packages/decision-engine` classifies each request's intent/changeType/risk and resolves a
      two-mode policy (`direct`/`review`), wired into `POST /conversation` as a logged observation
      only — `runAgentLoop` itself is untouched. Falls open to a fixed `medium`-risk decision on any
      classification failure, same shape as the Redis rate limiter above. Everything else from the
      original request (multi-provider routing, `Jev`, caching, telemetry, an evaluation harness, a
      debug UI, real enforcement) is named and deferred in the version doc, not dropped silently —
      V2's approval gate is the first real consumer of the risk field once it exists. **Live-provider
      run closed 2026-09-22** — both acceptance-test prompts classified correctly against the real
      Gemini provider (`status: "accepted"`, matching intent/changeType/risk/policy), not just the
      scripted `FakeProvider` cases. ~~V1.2 has no remaining open items.~~ **Reopened 2026-09-23,
      [D64](./DECISIONS.md)** — the user asked for the full platform this entry describes as
      deferred, in the 7 ordered slices now tracked in the version doc. Slice 1 (the
      `"low_confidence"` status) is done; see the version doc for the rest.
- [x] **AI-generated intake questions, 2026-10-18** — `apps/api/src/intake` + the planner's
      `requirements/generate-questions.ts` ask the model for product-specific clarifying questions
      from the raw prompt (not the deterministic `selectQuestions()`/`QUESTION_TEXT` registry above,
      which stays unused dead code on this path). Surfaced in the web UI as `IntakeDock` →
      `QuestionFlow`, with "Help me answer" / "Skip question" / "End chat" controls.
- [x] **D72 added 2026-10-19** — **intake questions carry model-generated multiple-choice options,
      not a fixed yes/no.** `PromptQuestionSchema.options: string[]` (2–4, with a validated
      `defaultOptionIndex`) replaces `defaultAnswer: boolean` end to end: the model prompt, the
      parser's option normalize/dedupe/clamp, `applyPromptAnswers`/`requirementTurns`, and the
      `question-flow` UI's answer buttons. See [D72](./DECISIONS.md).
- [x] **D73 added 2026-10-24** — **New Chat keeps the code.** A new chat inherits the current
      chat's `agent/<id>` branch and worktree instead of branching from `main`, so unmerged work
      carries over and no new worktree, install or dev server is created. Chats sharing a worktree
      run one at a time (409 `WORKTREE_BUSY`). Amends D8. See [D73](./DECISIONS.md).
- [x] Slice 1 — `Message`, `AgentEvent` (with `seq`), `StopReason`, `Budget`, `AgentEventSink` in `packages/agent-core/src/types.ts`
- [x] Slice 2 — provider abstraction (`providers/types.ts`), `FakeProvider`, `OpenAiProvider` (real, streaming, fetch-based, no SDK dep)
- [x] Slice 3 — tools (`list_files`, `read_file`, `write_file`, `edit_file`, `grep`, `bash`), path fence + deny-list, `wrapUntrusted`, `deps.allow.json` guard
- [x] Slice 4 — the loop (`loop.ts`): six exits, sequential/parallel tool execution, length-stop handling
- [x] Slice 5 — system prompt (`prompts/system.md`), injected with the live project file tree
- [x] Slice 6 — CLI harness (`cli.ts`) wired end to end: real provider, real tools, `SIGINT` → `AbortController`
- [x] Slice 7 — both acceptance tests pass against `templates/vite-react`; 24 tests green in `bun test`

> ✅ **2026-08-16: V0 is done.** The gap this note used to describe — scaffolding with no loop
> behind it — is closed. `runAgentLoop` and `FakeProvider` were TODO stubs at session start; both
> are implemented and tested now, plus the real `OpenAiProvider` and full tool wiring that didn't
> exist at all.

### Known broken — verified against the code 2026-08-16

Not "todo". These are things the docs claimed were working and are not.

| What                                                                                                                                                                                                                                                                                                                                                 | Where                                                  | Fix in                    |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------- |
| `bun run check-types` covers 15 of 20 workspace members post-restructure — `packages/config`, `packages/contracts`, `packages/db` still have none (`eslint-config`/`typescript-config` legitimately never will, no code to check). **`apps/web` fixed this session** — added `check-types` to its `package.json`, now wired into `turbo run check-types` | `package.json` × 3                                     | V0 Slice 7                |
| Preview iframe blank: dev-server port allocation had no liveness check, orphans survived API restarts, and dead processes stayed in the port map. **Fixed 2026-08-22** — `allocatePort()` probes the OS, `stopAllDevServers()` runs on exit, `exitCode` is checked before reusing a port, and both spawns use `inherit` instead of an undrained pipe | `apps/api/src/workspace/manager.ts`                    | fixed                     |
| `MODEL_PROVIDERS` lists `llama-3.1-8b-instant`, which Groq no longer serves — picking it returns `model_not_found`. The xAI key in `.env` is also rejected. Found while verifying usage reporting; **not** fixed, because neither is about V1.1                                                                                                      | `packages/agent-core/src/providers/openai.ts` · `.env` | next session              |

**Fixed this session, previously listed here:**

- `safeResolve` / `workspaceRoot` — already exported when checked; the real bug was the fallback
  path in `PROJECTS_DIR` being off by one directory level (`../../../../templates` resolved to
  `packages/templates`, not the repo root) — fixed to `../../../../../templates`.
- `bun test` walking `ref-ai/`'s 438 tests — fixed via explicit roots in the `test` script
  (`bun test apps packages`) plus `--path-ignore-patterns 'ref-ai/**'`.
- `apps/web` was a 255-line UI from the deleted architecture, wired to `:4000` with nothing
  listening — reorganized into `docs/APPWRIGHT_FRONTEND_STANDARDS.md`'s feature-owned structure
  (`app/`, `routes/`, `features/*`, `realtime/`, `stores/`, `shared/*`), talking to the real API on
  `:3001`. TanStack Router/Query, Zustand, React Hook Form + Zod, Monaco (self-hosted, lazy-loaded,
  not the CDN copy `@monaco-editor/react` defaults to), error boundaries around each workspace
  pane, and `bun:test` unit coverage for the pure agent-prompt utilities are all in place.
  Deliberately not done: xterm/terminal (no backend PTY route exists yet — building the UI first
  would be a dead half-feature), Playwright (the standards doc itself says E2E comes at the final
  production-quality rung, not before the architecture works), and a full design-token migration of
  every existing screen (tokens are defined in `index.css`, but rewriting ~30 already-working files'
  classNames with no way to visually verify the result in this environment was judged too risky to
  do blind — new UI should use the tokens/`shared/components/ui` primitives going forward).

**Rule that caused all of this:** _"if a doc disagrees with the code, the code wins — then fix the
doc that session."_ It was written after the first two drifts and not applied. Re-run the audit at
every `/wrap`: open the files the docs name and check they say what the docs claim.

**Exit criterion for V0:** `bun run agent "read package.json, then add a clean script to it"`
produces **two chained tool calls in one turn, with no human input between them.**

Detail: [versions/V0_AGENT_LOOP.md](./versions/V0_AGENT_LOOP.md)

---

## The plan

```
 V0  AGENT LOOP           while-not-if · tools · streaming · providers
 V1  WEB APP + MEMORY     Projects/Sessions/Messages · SSE · 3-pane UI · preview
V1.1 UI SYSTEM           shadcn · Radix · Lucide · design tokens · component registry
V1.2 DECISION ENGINE     full classification · five-mode policy · POST /conversation branches on it
 V2  ISOLATION & CONTROL  git worktrees · approvals · diffs · verification
 V3  CLOUD SANDBOX        queue · orchestrator · sandbox · auth · multi-tenant   ◄ the wall
 V4  APP BUILDER          planner · blueprint · task DAG · full-stack generation ◄ Emergent parity
                          + UI system · design tokens · UI blueprint · design review
V4.5 VISUAL EDITOR        component graph · property panel · ChangeSet · exact edits ◄ the differentiator
 V5  BROWSER AGENT        drive the app · semantic clicks · E2E tests · visual checks
 V6  AUTONOMY & DEPLOY    self-heal · memory · observability · one-click deploy

 Track B (parked)         bridge · device auth — "run against MY machine's private repo"
```

Every version has **one** acceptance test. No partial credit. Never skip a rung.

---

## The files

|                                              |                                                                                       |
| -------------------------------------------- | ------------------------------------------------------------------------------------- |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)**     | The system. Diagrams, data model, every layer, where we deviate from the deck         |
| **[VERSIONS.md](./VERSIONS.md)**             | The ladder: eight rungs, ship criteria, estimates, sequencing rules                   |
| **[versions/](./versions/)**                 | The actual TODO list per version, with traps and definition of done                   |
| **[DECISIONS.md](./DECISIONS.md)**           | 53 decisions with trade-offs, plus 14 open questions that block work when reached     |
| **[ENGINEERING_STANDARD.md](./ENGINEERING_STANDARD.md)** | Lab identity, the four engineering questions, benchmark/failure/invariant rules, engineering gate (D71) |
| **[INVARIANTS.md](./INVARIANTS.md)**         | What must always be true, what enforces it, and whether it's actually tested          |
| **[CODE_QUALITY.md](./CODE_QUALITY.md)**     | How we write code here — patterns from `ref-ai/packages`. Keep it open while coding   |
| **[CRASH_COURSE.md](./CRASH_COURSE.md)**     | Every concept explained so far, six lines each, dated. Written the moment it's taught |
| **[LEARNING.md](./LEARNING.md)**             | What to learn at each version, and what's actually been mastered                      |
| **[INTERVIEW_PREP.md](./INTERVIEW_PREP.md)** | Questions built from this architecture                                                |
| **[sessions/](./sessions/)**                 | Session notes                                                                         |

---

## Rules

- **Write the acceptance test first.** It's the definition of done.
- **Every version ends in a demo, not a refactor.**
- **Never optimise before feeling the limitation** — and since D71, *measure* it. No queue until one
  process is visibly the bottleneck (with a number). No multi-stage Docker build until push times
  annoy you.
- **Invariants before code.** State what must hold in `INVARIANTS.md`, then build what enforces it.
- **Evidence over adjectives.** Never write "scalable"/"robust"; write the measurement or nothing.
- **Version done = acceptance test passes *and* the engineering gate is answered** (ENGINEERING_STANDARD).
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
