# V6 — Autonomy & Deploy

> **Goal:** the system fixes its own mistakes and ships the result to a real URL.
>
> **Status:** 🔴 not started · **Est.** 4+ weeks · **Depends on:** [V5](./V5_BROWSER_AGENT.md)

---

## Why this version exists

After V5 the agent can generate an app **and prove it works in a browser**. V6 is about the two things that decide whether people *keep*
using it:

1. **It doesn't hand you broken code.** When something is red, the system diagnoses and fixes it
   instead of reporting failure.
2. **The output is real.** Not a preview that dies when the sandbox is reaped — a deployed app on
   a live URL.

Everything here is a genuine feature, but nothing here should start before V4's loop is solid.
Self-healing on top of an unreliable planner just automates the wrong thing faster.

---

## Acceptance test

1. Plant a type error and a runtime error in a generated app. Start a run. The system detects
   both — one from `tsc`, one from the browser console — fixes both within the retry budget, and
   ends green.
2. Plant an **unfixable** error (import a package that does not exist on npm). The system tries,
   fails, stops cleanly at the budget, and reports *what* it could not fix. No infinite loop, no
   false success.
3. Click **Deploy**. The app is live on a public URL with a real database, within a few minutes.
4. Ask *"what changed in this project last week?"* — memory answers from history, not from an
   empty context.

---

## Architecture

```
              ┌──────────────────────────────────────────┐
              │              OBSERVABILITY               │
              │  build logs · runtime console · network  │
              │  DB queries · agent timeline             │
              └────────────────────┬─────────────────────┘
                                   ▼
                       ┌───────────────────────┐
                       │   ERROR CLASSIFIER    │
                       │ type│syntax│dependency│
                       │ runtime│config│db│auth│
                       └───────────┬───────────┘
                                   ▼
              ┌────────────────────────────────────────┐
              │            SELF-HEAL LOOP              │
              │                                        │
              │   classify → hypothesis → fix → verify │
              │        ▲                          │    │
              │        └──────── still red ───────┘    │
              │                                        │
              │   budget: N attempts · loop detection  │
              └────────────────────┬───────────────────┘
                                   ▼
                              green / blocked
                                   │
                                   ▼
                       ┌───────────────────────┐
                       │        DEPLOY         │
                       │ build → provision DB  │
                       │ → env → ship → verify │
                       └───────────────────────┘
```

---

## TODO

### Slice 1 — Observability
- [ ] Stream build output, dev-server stdout/stderr, and the browser console **out of the sandbox**
      into the event stream.
- [ ] Capture runtime errors from the preview iframe (inject an error handler into the dev server's
      HTML; postMessage them out).
- [ ] Log panel in the UI, filterable by source (build / runtime / network / db / agent).
- [ ] Agent timeline: a per-run trace of every task, tool call, and verification, with durations.
      You cannot debug an agent you cannot see.

### Slice 2 — Error classifier
- [ ] Taxonomy: `type` · `syntax` · `dependency` · `runtime` · `config` · `database` · `auth` · `network`.
- [ ] Deterministic-first: regexes and parsers on `tsc`/vite/npm output cover most cases at zero cost.
      LLM classification only for what falls through.
- [ ] Each class carries a fix strategy and the context the fixer needs (which files, which command
      to re-run).

### Slice 3 — Self-healing loop
- [ ] Failure → classify → build a targeted fix prompt (error + the relevant file slice + the
      strategy) → agent fixes → re-verify.
- [ ] **Retry budget** per task (start at 3) and per run.
- [ ] **Loop detection**: same error signature twice in a row → stop and escalate. Do not let it
      grind.
- [ ] On budget exhaustion: mark the task `blocked`, keep going on independent tasks, and report
      honestly. *"7 of 8 tasks completed; task 5 blocked on X"* is a good outcome. A silent green
      is not.
- [ ] Every heal attempt is persisted — it is training data for Slice 6 and the only way to tune
      the budget. **It is a `TaskAttempt` with `trigger = heal`, not a separate table**
      ([D35](../DECISIONS.md#decision-35-plan-and-execution-are-separate-tables--run-task-taskattempt--active-target-v4)).
      The attempt row already carries model, cost, error, and verification result — which is exactly
      what a heal needs recorded, and what makes the heal rate computable.

### Slice 4 — Deployment

**One target, in the user's own account** ([D41](../DECISIONS.md#decision-41-deployment-targets-the-users-own-accounts-and-the-connect-moment-is-at-deploy--active-target-v6-slice-4)).
A generated app is Next.js with API routes inside it, so there is no separate backend to ship —
the Railway/Fly row that used to be here is gone.

```
app  →  the user's Vercel, via the deploy API      no GitHub in the path
db   →  the user's managed Postgres                connected at Deploy, never at build
```

- [ ] **Connect flow, triggered by the Deploy button only.** Nothing during generation —
      the sandbox has its own Postgres ([D14](../DECISIONS.md#decision-14-the-generator-produces-full-stack-apps--active-target-v4-closes-o1),
      [D29](../DECISIONS.md#decision-29-the-environment-is-prepared-before-the-agent-starts--active-target-v3)),
      so there is nothing to ask for until the user wants a real URL.
- [ ] **Check which providers actually offer OAuth before naming a default Postgres.** Vercel does.
      Where only a programmatic API key exists, the user pastes a key and D41's no-custody property
      breaks for that provider. This is a five-minute check that changes the answer.
- [ ] Pipeline: production build in the sandbox → connect DB → `migrate deploy` → inject env →
      Vercel deploy API → smoke-test the live URL → return it.
- [ ] **Write-through secrets**: push the user's keys into their Vercel project env and keep no
      copy. **Never** in LLM context, never printed to logs, never in our database. The `Secret`
      model in `libs/ts/db` is then only needed for what [O5](../DECISIONS.md#open--not-yet-decided)
      leaves — preview-time keys, if we hold them at all.
- [ ] Write to the `production` [`Environment`](../DECISIONS.md#decision-42-environment-is-a-first-class-entity-and-it-ships-with-two-rows--active-target-v4-tables-used-at-v6),
      never to the project. `development` keeps the sandbox's generated `DATABASE_URL`.
- [ ] Rollback: Vercel keeps deployment history — promote an earlier one. Without Git integration
      there is no rollback-by-revert, so this is the mechanism, not a fallback.
- [ ] Custom domains + TLS.
- [ ] **Export project** — a downloadable `git bundle` or archive of the repo. **Not optional.**
      D41 puts git inside the sandbox and snapshots to our bucket, with no GitHub anywhere; without
      an export, Appwright disappearing takes the user's application with it. See Definition of done.

### Slice 5 — Memory
- [ ] Per-project memory: decisions made, conventions adopted, errors already fixed.
- [ ] Retrieval: hybrid keyword + vector + recency, injected into the planner and the agent.
- [ ] Cross-project learning: *"this dependency combination always breaks"* — a failure→fix→outcome
      store consulted before repeating a known mistake.
- [ ] Keep it small and evaluated. Unmeasured memory is a context-window tax that feels
      sophisticated and helps nothing.

### Slice 6 — Quality passes *(from `ROADMAP.md` P9)*
- [ ] Security scan on generated code: secrets in source, missing input validation, SQLi, XSS,
      unauthenticated routes.
- [ ] Accessibility pass: contrast, labels, focus order, keyboard navigation.
- [ ] Performance: bundle size, obvious N+1 queries, missing indexes.
- [ ] Report findings in the UI; offer a one-click "fix these" run.

### Slice 7 — Prove it
- [ ] All four acceptance steps.
- [ ] Measure the heal rate: of N planted errors of each class, what fraction healed? Publish the
      number to yourself. It is the only honest measure of whether this version works.

---

## Files this version touches

```
NEW  libs/ts/observability/src/*     log capture, runtime error bridge, timeline
NEW  libs/ts/healer/src/*            classifier + fix strategies + budget/loop detection
NEW  libs/ts/deploy/src/*            provider adapters, migrations, env injection, smoke tests
NEW  libs/ts/memory/src/*            store + hybrid retrieval
EDIT services/orchestrator/src/*          heal loop wired into the DAG executor
EDIT services/web/src/*                   log panel, timeline, deploy button, findings report
EDIT libs/ts/db/prisma/schema.prisma Deployment, Memory   (HealAttempt = TaskAttempt, D35)
```

---

## Traps

| Trap | Symptom | Fix |
|---|---|---|
| No retry budget | Infinite fix loop, unbounded spend | Hard budget + loop detection |
| Fix without diagnosis | Agent rewrites random files hoping something works | Classify first, then a targeted fix |
| Silent partial success | User ships an app with a broken checkout | Report blocked tasks loudly |
| Secrets in LLM context | Production credentials in a model provider's logs | Inject at deploy time only |
| Asking for a database mid-build | Signup wall before the first preview; kills the magic moment and breaks D29 | Connect at Deploy. The sandbox has its own Postgres |
| Storing a key we could have passed through | A vault to encrypt, rotate, and eventually leak | Write-through: push to their Vercel env, keep no copy |
| Shipping B without an export | The user's app cannot outlive us | Export project is a definition-of-done item |
| Memory as a dumping ground | Context bloat, worse output, higher cost | Curate; measure retrieval quality |
| Deploying unverified builds | Broken production | Smoke-test the live URL before returning it |

---

## Concepts to learn here

Error taxonomy & structured diagnostics · bounded retry / circuit breakers · deployment pipelines
& migrations · secret management · retrieval-augmented generation · evaluation (how do you *know*
the healer works?). See [LEARNING.md → V6](../LEARNING.md#v6--autonomy-and-operations).

---

## Beyond V6

From the old M1–M5 / P2–P11 board (now folded into
[V4_APP_BUILDER.md](./V4_APP_BUILDER.md)), still parked:

- **Repo intelligence (P3)** — symbol index, import graph, repo map so the agent reuses existing
  code instead of redefining it.
- **Fleet scale-out (P10)** — orchestrator picks among many workers by capacity; sticky routing.
- **Autonomous growth (P11)** — post-deploy monitoring feeds improvement suggestions back into
  the planner.
- **Track B — local mode** — the bridge, device auth, and handoff from
  [ARCHITECTURE.md §6](../ARCHITECTURE.md#6-track-b--remote-control--handoff-deferred).

---

## Definition of done

- [ ] Measured heal rate on planted errors, per error class.
- [ ] Unfixable errors terminate cleanly and honestly.
- [ ] One-click deploy produces a live, working URL with a real database, **in the user's own
      Vercel and Postgres accounts** ([D41](../DECISIONS.md#decision-41-deployment-targets-the-users-own-accounts-and-the-connect-moment-is-at-deploy--active-target-v6-slice-4)).
- [ ] **Nothing is asked of the user before the preview works.** The connect flow fires on Deploy.
- [ ] **The user can export their project and it builds outside Appwright.** Download it, `bun
      install`, `bun run build` — green. This is the check that Option B did not quietly become
      lock-in.
- [ ] No secret ever enters an LLM prompt — and no *deployed* secret is stored by us at all.
