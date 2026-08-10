# Devian — Roadmap & Task Board

> North star: **"AI Software Company in a Box."** User says "build me a crypto exchange" → the
> platform understands business → designs architecture → generates code → fixes errors → deploys →
> monitors → improves → scales → remembers.
>
> This file mirrors the tracked task board. Two tracks:
> 1. **MVP (M1–M5)** — ship a working end-to-end Lovable clone FIRST. No auth, no E2B, **frontend-only,
>    good UI** (registry-composed chrome + AI-generated leaves; see FRONTEND BUILDER).
> 2. **Grand roadmap (P2–P11)** — the 19-phase vision + E2B infra, **parked behind the MVP**.
>
> Build order (chained on the board): `M1 → M2 → M3 → M4 → M5 → P2 → … → P11`.
> Working under teaching-mode contract: partner/interviewer, design-first, I guide & the user writes code.

---

## TRACK 1 — MVP (active, do first)

Global constraints across all MVP phases: **no auth, no E2B (all local), frontend-only, good UI.**
(UI bar raised from the original "can be ugly" — see FRONTEND BUILDER → Locked decisions.)
Maps 1:1 to the user's 7-item image checklist (items #2/#3 = constraints, not phases).

### ▶ M1 — Create lovable code from scratch  (task #11, image #1) — IN PROGRESS
**Goal:** a prompt → the agent generates a lovable-style app, genuinely *from scratch*.
**Build:**
- Core generation loop (mostly already exists: `runAgent` → `runAgentLoop` → file tools).
- Fix the "from scratch" gap (see DESIGN STATE below) — the agent currently mutates the one
  canonical template in place, accreting leftovers (Frankenstein `App.tsx`).
**Acceptance:** type "build a notes app" → agent generates the app into a clean working copy →
run completes without crashing → file tree shows only that app's files (no leftovers from prior builds).

### M2 — Q&A + todo tasks  (task #12, image #4)
**Goal:** agent clarifies before building and shows a visible, executing plan.
**Build:** agent asks clarifying question(s) when the prompt is underspecified, then emits a
todo/plan checklist the client displays and the agent executes step-by-step (checking items off).
Formalizes the FENCE "write a PLAN" step into UI.
**Acceptance:** vague prompt → agent asks a clarifying Q → produces a visible todo list →
executes it and marks items done.

### M3 — See code in real time  (task #13, image #6)
**Goal:** watch code stream in live, not a 30–60s "building…" wait then a snapshot.
**Build:** stream the agent's file writes/edits + actions to the client as they happen.
KEY HINGE: the engine **already emits** a full event stream (`agent_start`, `tool_execution_start/end`,
etc.) but `runAgent` (`devianAgent.ts:263`) passes a **no-op `emit`** and throws it all away. M3 =
thread that event stream out → backend → WS → client. Reuses the user's FishStudio pattern
(authenticated WS + room broadcast + TanStack cache patching from WS events).
**Acceptance:** during a build, the client shows files/diffs updating in real time.

### M4 — Preview of final code  (task #14, image #7)
**Goal:** live preview of the running generated app.
**Build:** client iframes the working copy's Vite dev server (`:5173`); HMR reflects latest code.
**Acceptance:** after a build, the preview pane shows the working app; a follow-up edit → preview updates live.

### M5 — Working end to end  (task #15, image #5)
**Goal:** the whole loop runs as one demoable flow, no manual intervention.
**Build:** integration + verification tying M1–M4 together.
**Acceptance:** from a fresh prompt → Q&A/plan → code streams in → preview shows the running app →
iterate. Start to finish, clean.

---

## TRACK 2 — Grand roadmap (parked until after M5)

### P2 — E2B sandbox (real isolation)  (task #1)
Move each project from the faked local template into a real isolated E2B sandbox.
Sub-slices (each testable): **2a** sandbox boots + agent can exec/edit inside; **2b** `??` proxy
(Q2 trust boundary, zero DB creds in sandbox) + preview served from sandbox URL; **2c** object-store
hydrate/sync. `create_sandbox` via Orchestrator (single worker, no fleet yet).
**Acceptance:** create project → real E2B sandbox boots → agent edits inside → preview loads from
sandbox URL (not localhost) → delete → teardown.

### P3 — Repo Intelligence  (task #2)
File/symbol indexer, import + dependency graph, repo summary, plus a visible Repo-Map panel.
**Acceptance:** open Repo Map → see the graph; ask agent to add a feature using existing function X →
it imports the real X instead of redefining it.

### P4 — Verification Engine  (task #3)
Run `tsc --noEmit` + build + ESLint + dependency validation in the sandbox after each edit; capture
structured failures as red/green status. Never trust generated code.
**Acceptance:** force a bad edit (type error) → red with exact error; fix → green.

### P5 — Self-Healing  (task #4)
Error classifier (type/syntax/dependency/runtime/config/database/auth), fix loop feeding failures
back as `blocked:`, retry budget, loop detection.
**Acceptance:** plant an error → auto-fix to green within budget; plant an unfixable one → stops
cleanly at the retry budget (no infinite loop).

### P6 — Observability  (task #5)
Console/runtime/network/DB logs + agent timeline streamed from the sandbox.
**Acceptance:** throw a runtime error in the preview app → appears in the log panel/timeline →
agent reads it and reacts.

### P7 — Memory + Agentic RAG  (task #6)
Semantic/episodic/procedural memory, hybrid retrieval (keyword + symbol + vector + recency),
knowledge-graph relationships, learning engine (failure→fix→outcome reused next project).
**Acceptance:** a notable fact in project A (e.g. "fixed a migration") is recalled/applied in
project B; a retrieval query returns the right snippets.

### P8 — Thinking front-end  (task #7)
PM Agent → Business Validator → **Architecture Guardian** (the differentiator) → System Design Agent
→ Spec Builder → Planner. Generate good *systems*, not just code.
**Acceptance:** prompt "build a crypto exchange" → PM asks clarifying Qs → Architecture Guardian
outputs stack decisions → System Design emits ER/API diagrams → review the spec BEFORE any code.

### P9 — Quality agents  (task #8)
Security (JWT/XSS/CSRF/SQLi/secrets/validation), Scalability (100→1M users → indexes/caching/
queues/sharding), Cost Optimization, Visual Regression (screenshot/compare/fix).
**Acceptance:** run a scan → findings report; plant a vuln (e.g. SQLi) → flagged; change UI →
visual-regression flags the diff.

### P10 — Full fleet / scale-out  (task #9)
Orchestrator picks among many workers by capacity; Loadbalancer + sticky WS routing (Q1 Redis
registry, TTL heartbeats); multi-worker.
**Acceptance:** N concurrent projects each route to the correct worker; kill a worker → its project
transparently re-provisions, user never sees it.

### P11 — Deploy + Autonomous Growth  (task #10)
Deployment Intelligence (Vercel/Railway/Cloudflare/Neon/Upstash, one-click prod) → AI CTO Mode
(MVP scope/architecture/timeline/costs/risks/team/stack) → Autonomous Growth Loop (post-deploy
monitor errors/usage/retention → suggest + ship improvements).
**Acceptance:** click deploy → app live on a real URL; growth loop reads monitored usage/errors →
suggests and ships an improvement.

---

## ACTIVE TASK BOARD — Phase A/B/C (mirrors the tracked tasks)

The MVP work is sequenced into three chained phases. Build order is a strict dependency chain
(each blocked by the previous): **A1 → A2 → A3 → B1 → B2 → C1 → {C2, C3} → C4 → C5.**

**Phase A — unblock the loop (this IS M1; shared by every philosophy):**
- **A1** — Adopt & commit a minimal pristine baseline template. *(in progress)*
- **A2** — Two-directory model: repoint `projectRoot` off the typo'd path onto a **working copy**.
- **A3** — Per-project reset = `rm working/ ; cp template/ → working/`, on **new-project signal only**.

**Phase B — make it observable (M3 + M4):**
- **B1** — Thread the engine event stream out (kill the no-op `emit` at `devianAgent.ts:263`) → WS.
- **B2** — Client live file/diff stream + iframe the working copy's Vite dev server (`:5173`).

**Phase C — the block-registry / planner layer (the user's frontend system design; P8 pulled forward):**
- **C1** — Design the block registry schema (block = folder of files + `manifest.json`).
- **C2** — Planner stages: Requirement → Design → Component (structured JSON, replaces FENCE prose plan).
- **C3** — Component Selector: deterministic rule-based scoring (not "LLM picks block #7").
- **C4** — Inject + configure selected blocks; narrow the agent to app-specific code only.
- **C5** — Agent write-fence (allowlist in `safeResolve`) + replace-vs-modify edit loop.

**Sequencing decision (locked):** the registry (Phase C) is the right long-term architecture but
front-loads a large block-authoring burden. So we ship the from-scratch loop (A+B) FIRST — a running
loop makes every registry decision testable — then layer the planner/registry on top. Matches the
"MVP first, grand roadmap parked" rule.

---

## FRONTEND BUILDER — the architecture I want (canonical)

This is the target system: a **frontend-only AI builder** that produces good UI reliably by composing a
registry, not by free-generating chrome. Full-stack (backend/DB agents) stays parked in NORTH-STAR/P2+.

### Locked decisions
- **Scope:** frontend only. Mock data layer in `src/data/` stands in for any backend. No Postgres/Prisma.
- **UI bar:** "good UI," not "ugly." M1's acceptance is raised: compiles, runs, **and looks good** —
  consistent spacing/typography, real layout shells, no AI-slop (no gradient-purple, no mismatched cards).
- **The hybrid (how we hit the UI bar):** split by layer.
  - **Chrome** (sidebar, navbar, cards, charts, tables, calendar, auth, forms, modals/drawers) →
    *composed from the registry, AI never generates it* — bad state is unrepresentable.
  - **Leaves** (page bodies, feature components, stores, hooks) → *AI-generated under FENCE rules* —
    only the genuinely app-specific code is a generation dice-roll.
- **Planner / Executor separation (the spine):** the system is a **compiler**.
  - **Planner pipeline** (mostly LLM) → emits ONE typed **`FrontendBlueprint`** (JSON) — the IR.
  - **Executor pipeline** (deterministic) → consumes the Blueprint: copy blocks, apply theme, wire
    routes, then hand only app-specific tasks to the generation agent.
  - Why: the Blueprint is inspectable BEFORE any code is written, cacheable, testable, and replayable.
    Wrong UI is usually a planner fix, not a generator fix. (Same instinct as walletX's outbox:
    persist the intent as data, execute separately → inspect / retry / replay.)

### The pipeline (each step tagged DET/LLM and MVP/LATER)
```
Intent Understanding        LLM  MVP    {project, industry, target, complexity}
Domain Knowledge Engine     DET  LATER  load per-industry knowledge pack (flat JSON first, graph later)
Requirement Intelligence    DET  MVP    infer needs (sidebar/table/forms/charts/calendar/search…)
Adaptive Question Engine    LLM  MVP    ask ONLY low-confidence questions (style? primary color?)
Business / UX / Design      LLM  ½      users, navigation, design language  (MVP: collapse to 1 planner)
  ↓
FRONTEND BLUEPRINT (IR)     ──   MVP    the single JSON artifact everything below consumes
  ↓
Layout Planner              DET  LATER  each page → a layout tree (Header → KPI row → Chart grid → Table)
Pattern Planner             DET  LATER  pick a UX PATTERN first (CRM/Dashboard/POS…), then components
Component Planner+Selector  DET  MVP    score Component Registry → block id per need
Theme Planner               DET  MVP    emit design TOKENS from the chosen theme (no JSX)
  ↓
Workspace Composer          DET  MVP    copy starter + theme + selected blocks + assets  (== A2/A3 + C4)
  ↓
Frontend Generation Agent   LLM  MVP    Pages / Features / Routing — app-specific code ONLY
  ↓
UI Review Engine            DET  LATER  senior-designer pass: spacing/contrast/overflow/responsive/a11y
Live Preview + HMR          ──   MVP    == B1 + B2
Learning & Ranking Engine   DET  LATER  user replaces block X→Y ⇒ rerank; feedback bandit over the registry
```
**MVP subset** (the cheapest slice that proves the thesis): Intent → Requirement → (1) Design Planner →
Blueprint → Component Selector + Theme → Composer → Generation Agent → Preview. Everything tagged LATER
(domain packs, layout/pattern planners, UI Review, Learning) is deferred until the MVP loop runs.

### The three registries
- **Component Registry** — `registry/<category>/<block>/` (layout, sidebar, navbar, dashboard, cards,
  tables, charts, calendar, forms, auth, search, filter, modal, drawer, settings, footer…). Each block:
  `component.tsx · metadata.ts · schema.ts · tokens.ts · variants.ts · preview.png · README.md`.
  Blocks live in the registry, **NEVER** in the starter. "Inject" = copy files + merge deps + wire route.
- **Theme Registry** — Luxury / Enterprise / Startup / Salon / Fintech / Minimal / Crypto / … Each theme =
  colors, typography, radius, spacing, elevation, animation, icons. Design Planner picks one → tokens only.
- **Pattern Registry** (the differentiator, LATER) — CRM / Dashboard / Marketplace / POS / Booking / … Each
  pattern = recommended page hierarchy + navigation style + layout graph + common widgets. The planner
  chooses a **pattern first**, then selects components to implement it — instead of assembling pages from
  isolated blocks. This is what makes output feel designed, not stitched.

### Component Selector (deterministic, not "LLM picks block #7")
Score registry blocks against extracted needs (tag overlap, capability match, layout family) → top-ranked
block per need. Deterministic, debuggable, scales to hundreds of blocks, and feeds the Learning Engine later.

### Agent fence
May edit `src/pages|features|store|hooks|lib|components/app`; may NOT touch `components/ui`, theme tokens,
or tailwind/vite/tsconfig. Enforced as a write allowlist in the tool layer (`safeResolve`).

### Start small
ONE domain, **3–4 blocks** (auth, sidebar, dashboard/stats, table), one theme — not 400 blocks / 12 domains.

### How this maps to the A/B/C board
- Planner stages + Blueprint → **C2**.  Component Selector → **C3**.  Workspace Composer / inject → **C4**
  (built on the **A2/A3** working-copy plumbing — the executor's first stage IS `cp template → working`).
- Generation agent narrowing + edit (replace-vs-modify) → **C5**.  Stream + preview → **B1/B2**.
- Blueprint schema design is the next real artifact once **A1** clears and the executor has ground to run on.

---

## NORTH-STAR VISION — full-stack AI solution architect (PARKED, do NOT pull into MVP)

> Recorded for direction only. This is the grand version of Phase C. It maps onto existing
> P-phases; the A/B/C board stays frontend-only and small. Nothing here is an active task.

The 17-step pipeline (Intent → Domain Knowledge → Architects → Planners → Component Selection →
Workspace Composer → Multi-Agent Generation → Multi-Verifier → Preview):

```
Intent Understanding (LLM)         ── classify request {intent, businessType, industry, users}
Domain Knowledge Engine (DET)      ── load knowledge pack per industry (entities/pages/widgets/KPIs/workflows)
Business + UX + Technical Architects── business model, nav/flows, frozen stack decisions
Frontend/Backend/DB/Infra Planners ── per-layer plans from blueprint
Requirement Confidence + Adaptive Q── score uncertainty, ask ONLY the low-confidence questions
Architecture Decision Engine (DET) ── freeze stack; no downstream planner overrides it
Component + Backend Module Selection── score registries (UI blocks + backend modules)
Theme Engine (DET)                 ── design tokens from design language
Workspace Composer (DET)           ── copy starter + blocks + modules + theme + assets (NO AI yet)
Multi-Agent Generation (LLM)       ── Frontend / Backend / Database / API agents, app-specific code only
Verification Engine (DET)          ── tsc → build → eslint → unit → UI snapshot → a11y → perf → runtime
Live Preview + HMR
Follow-up Editing                  ── planner re-selects; replace block, keep backend
```

**Phase mapping:** Intent/Architects/Adaptive-Q → **P8** (thinking front-end). Multi-verifier → **P4**.
Backend modules + multi-agent generation → **P2+** (needs the sandbox). Knowledge Graph → **P7** (memory).

**The core thesis (the thing the MVP must prove cheaply):** push intelligence OUT of the LLM into
**deterministic engines** (knowledge packs, registries, frozen decisions, theme engine, composer).
The LLM only does: intent classification, the adaptive questions, and final app-specific generation.
Everything tagged (DET) above is hand-authored content, not a prompt — that is the moat AND the cost.

**Open vision-level decisions (NOT yet made — for the user to settle before any of this is scheduled):**
1. **Knowledge pack (flat JSON) vs Knowledge Graph** — graph is the eventual shape; a flat per-domain
   pack gives ~95% of the value for one domain. Graph earns its keep only when a planner needs a query
   a flat pack can't answer (cross-domain reuse, shared-entity inference). Start flat; graph when proven.
2. **Full-stack vs frontend-only for the proof** — ✅ **DECIDED: frontend-only.** MVP builds frontend
   only, with a HIGH-QUALITY UI bar (not "ugly"). Mock data layer (src/data/) stands in for the backend;
   no Postgres/Prisma/API agents. Backend multi-agent generation stays parked in P2+.
3. **Determinism boundary** — tag every one of the 17 steps DET vs LLM; that table is the build spec.
4. **Multi-agent ordering** — DB agent → API agent is a DAG with shared mutable workspace; design the
   dependency order AND the failure semantics (bad schema consumed by downstream agents) before building.

**Sequencing rule (unchanged):** prove the thesis with ONE domain, a tiny registry, frontend-only,
on top of the already-running A+B loop. Generalize to many domains / full-stack / graph only after.

---

## M1 — LIVE DESIGN STATE

> ⚠️ **STALE as of 2026-08-10.** This section described a code state that no longer exists.
> Re-audited against disk — see the corrections below. Current status of record:
> [`docs/PROJECT_ROADMAP.md`](./docs/PROJECT_ROADMAP.md).

**Corrections from the 2026-08-10 audit — every claim below was checked against disk:**

| Old claim | Reality on disk |
|---|---|
| "nested `.git` inside `apps/project-template/fronted/`" | ❌ **No nested `.git` exists** anywhere in the repo. Already resolved. |
| "`projectFiles.ts:8` points at `frontend` but the folder is `fronted` (typo) → 500s" | ❌ **No typo, and no such line.** `projectFiles.ts` never referenced the template — it resolves a per-project workspace directory. |
| "`projectRoot` is still a module-level constant" | ❌ **No `projectRoot` exists.** It is already `workspaceRoot(projectId)` — per-project, with `safeResolve(projectId, relPath)`. The multi-project problem this flagged is **already fixed**. |
| "template is CORRUPTED" | ❌ Already corrected in this file; the template `src/` is clean and compiles. |
| `apps/opencode/*` (all references) | ❌ **Directory deleted.** The only agent-loop reference now is `ref-ai/packages/`. |
| "`script/reset-project.mjs` — dead reset script" | ✅ Was true. **Deleted** 2026-08-10; workspace creation is rebuilt properly in V1 Slice 6. |
| `apps/agent-engine/` (Python scaffold) | ✅ Superseded by [D4](./docs/DECISIONS.md). **Deleted** 2026-08-10. |

**Net effect:** phase A1's blocking questions (nested `.git`, the path typo, the global `projectRoot`)
are **all moot**. `libs/ts/contracts/src/utils/projectFiles.ts` already implements the per-project
workspace model that A2 was reaching for — V1 builds on it rather than replacing it.

**Decisions reached (by the user, via design questioning) — still valid:**
- **Two-directory model:** `project-template/` = pristine, read-only, agent never touches it (source of
  truth). A separate **working copy** = what the agent edits, Vite serves, and the snapshot reads.
- **Reset = `rm working/ ; cp project-template/ → working/`** (what the dead `reset-project.mjs` was
  reaching for: `project-template → project`).
- **Reset granularity = per project**, on a NEW-project request (NOT on every iteration like "add dark mode").
- **Baseline content = minimal blank starter** (already true) — makes block-injection clean and the
  missing `delete_file` tool largely irrelevant.

**Open questions — only one survives the audit:**
1. ~~Nested `.git` reconciliation~~ — moot, no nested `.git` exists.
2. **The `cp` exclude contract** — `node_modules`, `bun.lock`, `.git`: which poison the working copy,
   at copy/edit/serve time? (Docker `.dockerignore` ↔ `rsync --exclude` shape.) → **still open**,
   answered in V1 Slice 6.
3. ~~`projectRoot` is a module-level constant~~ — moot, already per-project (`workspaceRoot(projectId)`).
4. How does the system decide **new project vs iterate**? → resolved by design: reset happens on
   `POST /project` only, never on a follow-up message. See V1 Slice 1.

---

## Key file map (re-audited 2026-08-10)

**Live:**
- `libs/ts/contracts/src/utils/projectFiles.ts` — `workspaceRoot(projectId)`, `safeResolve(projectId, relPath)`,
  `listProjectFiles` / `readProjectFile` / `writeProjectFile`. Per-project, path-escape guarded. **Reuse this.**
- `libs/ts/db/prisma/schema.prisma` — Prisma + Postgres. Old shape (`ConversationHistory`); V1 Slice 1 rewrites it.
- `templates/vite-react/` — the pristine template. Clean, compiles, correctly spelled.
- `ref-ai/packages/agent/src/agent-loop.ts` — **the agent-loop reference to port from.** The only one left.

**Empty or stubs (V0/V1 fill these in):**
- `services/api/src/index.ts` — 5-line stub.
- `services/orchestrator/src/index.ts` — empty (0 lines).
- `services/agent/src/index.ts` — empty (0 lines).
- `services/web/src/App.tsx` — Vite starter, not the 3-pane UI.

**Deleted (do not look for these):**
- `apps/opencode/` — held `devianAgent.ts`, `agentLoop.ts`, `agentTools.ts`. Gone.
- `apps/agent-engine/` — Python scaffold, superseded by [D4](./docs/DECISIONS.md). Deleted 2026-08-10.
- `script/reset-project.mjs` — dead paths. Deleted 2026-08-10.

</content>
