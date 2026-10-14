# V1.2 — Decision Engine

> **Goal (original, closed 2026-09-22):** every incoming request gets classified (intent, change
> type, risk) and that classification resolves to an execution mode, visible in the logs — without
> touching how the agent actually runs.
>
> **Goal (reopened, [D64](../DECISIONS.md)):** the classification actually gates and branches
> execution — direct/tool/agent/review/blocked — plus components, verification, infra, and an
> evaluation harness, built in the 7 slices below, one session at a time.
>
> **Status:** ✅ done 2026-09-23 — all 7 slices · **Depends on:** [V1](./V1_WEB_APP.md)

---

## Slices ([D64](../DECISIONS.md) reversed [D63](../DECISIONS.md)'s scope-down — read that entry
## before picking up a slice; it records why Slice 1 skipped one of its own listed items)

- [x] **Slice 1 — foundation.** `DecisionStatus` gained `"low_confidence"` (parsed + schema-valid,
      but the model scored it under 0.5), distinct from `"accepted"`. `resolvePolicy()`'s own
      `confidence < 0.5` check stays as a safety net for hand-built `DecisionResult`s. 12/12 tests
      green, `tsc --noEmit` clean in `packages/decision-engine` and `apps/api`. **Skipped:** the
      `Choice`/`Score`/`Noul` question-type union — no caller until a Slice 6 provider router
      exists to dispatch to; see D64.
- [x] **Slice 2 — runtime control**, done 2026-09-23. `Decision` gained `route`
      (`frontend`/`backend`/`database`/`devops`/`none`), `complexity` and `ambiguity` (0–10), and
      the `"test"` intent. `ExecutionMode` is now five values (`direct`/`tool`/`agent`/`review`/
      `blocked`); `resolvePolicy()` blocks `delete`+`database` outright, sends `route: "database"`/
      `ambiguity >= 8` to review alongside the existing risk/changeType/confidence rules, routes
      `test` intent to `tool`, and now requires `route: "none"` (not just low risk) for `direct`.
      18/18 tests green, `tsc --noEmit` clean in both packages.
      **A live run against the real provider caught a real bug before it shipped:** the first prompt
      draft for `route` got read by the model as "which layer does this touch", so "change the
      button color to blue" came back `route: "frontend"` → policy `"agent"`, regressing the
      original acceptance test's `"direct"` result. Fixed by clarifying in the prompt that `"none"`
      means "a self-contained tweak needing no system-level reasoning, even if the file lives in a
      frontend/backend directory" — re-run confirmed `"direct"` again. This is exactly why Slice 2
      isn't marked done on `tsc`/`bun test` alone; the scripted `FakeProvider` tests can't catch a
      prompt-wording bug like this because they don't exercise the model's actual judgment.
      **Behavior change from the original (2026-09-22) acceptance test:** "drop the users table" now
      resolves to `"blocked"`, not `"review"` — a real refinement (delete+database is now its own
      mode), not a regression; the original test's *intent* ("never auto-run this") still holds.
- [x] **Slice 3 — conversation integration**, done 2026-09-23 ([D66](../DECISIONS.md)).
      `classify()` moved ahead of `planTasks()` in `POST /conversation` and is now awaited instead
      of fire-and-forget. `policy: "blocked"` hard-stops before `planTasks()` or `runAgentLoop` ever
      run — reuses the file's existing stop-reason pattern (`finalStopReason`/persist/`break` inside
      the verify loop), not a new code path. `policy: "direct"` skips `planTasks()`. `tool`/`agent`/
      `review` are byte-for-byte the prior behavior (plan + full loop) — no standalone tool runner or
      approval gate exists in this codebase, so those modes don't yet branch to anything different.
      **Verified live end-to-end**, not just type-checked: spun up Postgres/Redis, ran the real API
      server, registered a user, and sent real `POST /conversation` requests. "drop the users table"
      → blocked before any model call, correct SSE `status`/message frames, session left `IDLE`.
      "change the primary button color to blue" → `policy: "direct"`, confirmed no `"Plan:"` message
      in the stream and the loop going straight to `read_file`/`edit_file` tool calls. Both consistent
      with the `decision` log line. Torn down after (containers stopped, server killed).
      **Deliberately not built:** the deterministic precheck (slash commands like `/test`/`/format`
      don't exist in this app — nothing to precheck against yet); a standalone tool runner for
      `"tool"` mode (the agent loop's `bash` tool can already run tests; a separate executor with no
      evaluation data behind the classifier would be exactly the premature infra D63/D64 both warn
      about); a standalone AST-based direct executor (item 17/41 of the original spec — building a
      new file-editing path outside `edit_file`'s exact-match guardrail ([D16](../DECISIONS.md)) on
      an uncalibrated classifier is a real data-loss risk, not a style choice); and an approval
      service for `"review"` (V2's job, explicitly out of scope per the spec's own item 45).
- [x] **Slice 4 — components**, done 2026-09-23 ([D67](../DECISIONS.md)). `Decision` gained
      `component`, a `z.enum` built from `@repo/ui-system`'s live registry keys (`Button`/`Card`/
      `Input`/`Label`/`Select`/`Dialog`/`Badge`/`Table`/`Tabs`) plus `"none"` — grounded in the real
      registry, not a free-text guess, so a hallucinated name fails the schema and falls open to
      `"invalid"` rather than passing through as a plausible-looking decision. `decision-engine` now
      depends on `@repo/ui-system` (previously zero coupling; confirmed no cycle — `ui-system` has no
      runtime dependencies of its own). 21/21 tests green (including one that scripts a
      `FakeProvider` reply naming a real component outside the registry and asserts it's rejected),
      `tsc --noEmit` clean in both packages.
      **Live-verified against 7 real prompts**, not just the schema: five UI requests correctly named
      the exact live primitive (`Button`, `Card`, `Table`, `Dialog`, `Input`, right casing, zero
      invented names), two non-UI requests correctly came back `"none"`. No status flipped to
      `"invalid"` — unlike Slice 2's `route` bug, this one worked on the first live pass.
      **Deliberately not built, against the original spec's items 18–20 (family → candidate lookup →
      resolver):** the registry has no family/category taxonomy today — it's nine flat primitives,
      and its own comment says so on purpose ("an unused registry entry is inventory with no
      demand"). At nine entries, `uiSystemPromptSection()` already injects the *entire* registry into
      every system prompt unconditionally — narrowing to a "small candidate set" saves zero context
      budget at this scale; the spec's rationale for that step (hundreds of components, semantic
      search needed to bound the problem) doesn't apply yet. Building a family taxonomy and a
      candidate-narrowing resolver now would be inventing structure for a registry ten times smaller
      than what would need it — the same D63/64/65/66 pattern. `component` is additive data only
      this slice: `resolvePolicy()` doesn't branch on it yet (see D67) — its planned first consumer
      is Slice 5's requirement/scope verification ("did the expected component actually change?").
- [x] **Slice 5 — verification (retry policy + loop detection only)**, done 2026-09-23
      ([D68](../DECISIONS.md)). New `packages/decision-engine/src/verify.ts`:
      `shouldRetryVerification(history, maxAttempts)`, a pure function — retry allowed under the
      attempt cap, unless the last two failures produced byte-identical `tsc` output, in which case
      the fix attempt provably made no difference and retrying further just burns tokens on a
      pattern already shown not to work. Wired into `apps/api/src/routes/conversation.ts`'s existing
      `tsc --noEmit` retry loop in place of the old bare `attempt === MAX_VERIFY_ATTEMPTS` check;
      the persisted give-up message now distinguishes "same error twice" from "attempts exhausted."
      26/26 tests green (5 new, covering every branch), `tsc --noEmit` clean in both packages. No
      live-provider re-verification this slice — unlike Slices 2/4, nothing about what the model is
      *asked to produce* changed; this is deterministic control flow around an already-tested pure
      function, so unit tests cover the actual risk surface.
      **Deliberately not built, against the original spec's items 21–23 (Tier 2 requirement/scope
      check — "did the expected component change, did unrelated files change") and the failure-type
      classifier in item 24:** the pre-D64 V1.2 doc's own Deferred table already named "a
      verification engine" as belonging to V2/V4's verify tier, for a reason that's still true after
      reopening — checking whether generated code *satisfies the request* is a different, harder
      problem than checking whether it compiles, and a hand-rolled heuristic here (e.g. "did a file
      matching `decision.component`'s registry path change") risks producing confidently wrong
      signals with no evaluation data to calibrate against, which is worse than no signal. Slice 7's
      eval harness is where that calibration would come from. A failure-type classifier (syntax vs.
      semantic vs. import) was skipped for the same reason the original spec itself warns against in
      item 22: don't make verification another giant LLM prompt without a felt need past the one
      signal (identical output) that already catches the common stuck case.
- [x] **Slice 6 — infrastructure (telemetry only)**, done 2026-09-23 ([D69](../DECISIONS.md)). Two
      small additions to `apps/api/src/routes/conversation.ts`'s existing structured logs, both
      surfacing facts the code already computed rather than adding new logic:
      1. The `"decision"` log line gained `plannerSkipped` (`policy === "direct" || "blocked"`) —
         the actual "LLM calls avoided" signal the original spec's item 32 wanted, now visible per
         request instead of only inferable by cross-referencing `policy`.
      2. A new `"verification gave up"` log line fires when Slice 5's `shouldRetryVerification()`
         says stop, with `attempts` and `stuck` (byte-identical-output loop detection vs. attempt-cap
         exhaustion) — previously this only showed up as a chat message, with zero structured signal.
      `tsc --noEmit` clean, 31/31 tests green across `decision-engine` + `apps/api`. No live-provider
      re-run — this only reorganizes existing control flow into a named boolean (`!(a || b)` →
      `!plannerSkipped`, proven equivalent by De Morgan's law) and adds log calls; nothing about
      model behavior changed.
      **Deliberately not built — decision cache, decision trace, provider health/fallback, and the
      question-type union's second caller:**
      - **Cache:** skipped for a sharper reason than "no felt need yet" — user prompts to an app
        builder are close to always-unique text, so a cache keyed on the normalized request would
        have a near-zero hit rate by the nature of the input, not just by lack of measured traffic.
        Caching something that structurally won't repeat isn't premature optimization, it's the wrong
        optimization.
      - **Decision trace:** `packages/logger`'s `runWithTrace`/`setTraceContext` (`apps/api/src/index.ts`
        wires `requestId`/`userId` into ambient `AsyncLocalStorage` context) already attaches
        correlation fields to every log line automatically, including the `"decision"` line above.
        A bespoke `DecisionTrace` type with its own `runId` would duplicate infrastructure that
        already exists under a different name, not fill a gap.
      - **Provider health/fallback:** `classify()` intentionally reuses whichever provider the
        session's own model already resolves to (D63's original reasoning) — there's no second
        provider *for the decision engine to choose between*, and a call failure already fails open
        to `provider_error` → `"review"` without needing an active health registry.
      - **Question-type union:** still has no second caller, since no provider router was built.
- [x] **Slice 7 — evaluation**, done 2026-09-23 ([D70](../DECISIONS.md)). New
      `packages/decision-engine/evals/{cases.ts,run.ts}` + `bun run eval`. 15 hand-written cases,
      one file (not 7 per-field `.jsonl` files as the original spec suggested) — this repo's
      `classify()` produces one combined `Decision` per call, not per-field questions dispatched
      separately (Slice 1 skipped that architecture), so a per-field dataset would describe a system
      that doesn't exist. `run.ts` calls the real provider (not `FakeProvider`) and reports policy
      accuracy, a safety-specific **under-cautious** count (did the model run something more
      permissive than expected — the one number that actually matters per the original spec's own
      framing), and per-field accuracy. Deliberately a reporting tool, not a CI gate — no accuracy
      threshold is enforced, because there's no prior calibration data to justify picking one.
      **Final result: 15/15 policy accuracy, 0/15 under-cautious**, after two rounds of fixing the
      *eval data*, not the classifier — both real findings, kept in the case file's comments:
      a checkout-API-500 case got called `risk: "high"` (fair — revenue-critical path) against an
      expectation of `"agent"` that never justified itself, and a typo-fix case got sent `"direct"`
      by `route: "none"`'s own D65 definition ("even if the file lives in a frontend **or backend**
      directory") against an expectation that assumed all backend work needs `"agent"`. Neither was
      a classifier bug — both were this slice's own test data encoding an assumption that contradicted
      a decision already made in an earlier slice. One field-level miss remains on purpose
      (`risk: "low"` expected, model said `"medium"` for an email-sent-twice bug) — left as honest
      residual variance since it doesn't change the resulting policy and is a defensible call.
      The one real regression this session (D65's route-wording bug) is encoded as
      `regression-direct-style`, the suite's first case.
      **Regression-suite practice going forward, not retroactively invented:** there's exactly one
      real bug on record (D65's), so that's the one fixture. The mechanism ("every future
      classifier bug gets added to `cases.ts`") is in place; the dataset itself will only grow as
      real cases are found, per the same "never optimise before feeling it" rule the rest of this
      version followed.

---

## Why this version exists

This rung wasn't earned the way the others were — it's a user-directed insertion, not a felt
limitation, and that's worth saying plainly rather than dressing it up after the fact (same honesty
[D54](../DECISIONS.md) uses for its own reversal). The user asked for a much larger "Decision
Engine" platform — multi-provider classification, a six-mode policy engine, caching, telemetry
tables, an evaluation harness, a debug UI. That got scoped down to this: the smallest slice that's
real today, because _never optimise before feeling the limitation_ and _every version has one
acceptance test_ are not negotiable regardless of who's asking. The repo already reversed itself
once on exactly this failure mode — D55→D58 built a full AI-scaffolded inference platform and
deleted it the same day, because the goal here is learning by hand-building one version at a time.

So: a request gets classified, the classification resolves to `"direct"` or `"review"`, and it's
logged. Nothing acts on `"review"` yet — that enforcement is V2's approval gate, not this version's.

---

## Acceptance test

1. `POST /conversation` with "change the button color to blue" logs a decision with
   `intent: "modify"`, `changeType: "style"`, `risk: "low"`, policy `"direct"`.
2. `POST /conversation` with "drop the users table" logs a decision with `intent: "delete"`,
   `changeType: "database"`, `risk: "high"`, policy `"review"`.
3. In both cases the agent turn runs and completes exactly as before — the decision is a log line,
   not a gate.

### Result — run 2026-09-22

| Step                                                    | Result                                                                                                             |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `bun test packages/decision-engine`                       | ✅ 7/7 pass — `resolvePolicy` table cases, `classify`'s JSON-parse and schema-mismatch fallback via `FakeProvider` |
| `bunx tsc --noEmit` in `packages/decision-engine`          | ✅ clean                                                                                                            |
| `bunx tsc --noEmit` in `apps/api` (with the new wiring)    | ✅ clean                                                                                                            |
| Live `classify()` run against the real provider (Gemini, via `OpenAiProvider`) | ✅ Run 2026-09-22 — `"change the button color to blue"` → `{intent: "modify", changeType: "style", risk: "low", confidence: 0.98}` → policy `"direct"`. `"drop the users table"` → `{intent: "delete", changeType: "database", risk: "high", confidence: 0.99}` → policy `"review"`. Both match the acceptance test exactly, `status: "accepted"` in both cases. Run via a throwaway script calling `classify()`/`resolvePolicy()` directly (no OpenAI key in this environment; `GEMINI_API_KEY` is set and `gemini-flash-latest` routes through the same `OpenAiProvider`), not the full `POST /conversation` HTTP path. |

**Superseded 2026-09-23 (Slice 2, [D64](../DECISIONS.md)):** item 2's expected policy is now
`"blocked"`, not `"review"` — the five-mode policy added in Slice 2 gives `delete`+`database` its
own mode. Re-verified live: same prompt, same `intent`/`changeType`/`risk`, policy now `"blocked"`.
Item 1 was re-verified live too, and initially *failed* — see Slice 2's note above for the
route-wording bug that caused and then fixed it.

---

## Architecture

```
POST /conversation
        │
        ▼
  planningProvider = new OpenAiProvider({ model: session.model })   ← already existed, reused
        │
        ├──► planTasks(...)                     (unchanged)
        │
        └──► classify(prompt, planningProvider) ──► resolvePolicy(decision)
                        │                                   │
                        └──────────────► log.info("decision", { sessionId, decision, policy })
        │
        ▼
  runAgentLoop({ ... })   ← untouched. No hook inside loop.ts, no new SSE frame,
                             no Message.data schema change.
```

`classify()` reuses `@repo/agent-core`'s existing `Provider` interface directly — there's exactly
one real provider in this repo, so a router over four (one of which, Jev, doesn't exist here) would
route over nothing. On any parse failure it falls open to a `medium`-risk `"unknown"` decision
rather than throwing, the same shape as the Redis rate limiter failing open rather than blocking
login over an auxiliary dependency.

---

## Deferred — not in this version

Everything below was in the original request. Cut for the reason stated, not dropped — pick a
specific piece back up once a version actually needs it.

| Piece                                              | Why it's not here                                                                         |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Multi-provider router (OpenAI/Anthropic/Gemini/Jev) | One real provider exists. A router over three phantom ones routes over nothing.               |
| `Jev`/Anthropic/Gemini `DecisionProvider` adapters   | Same reason — no second provider to adapt to yet.                                             |
| Six-mode policy engine, project/component config    | Two modes (`direct`/`review`) cover everything the acceptance test needs. No second caller.   |
| Decision caching                                    | No measured cost or latency problem to cache away yet.                                        |
| Telemetry tables + dashboard                        | Nothing consumes the data yet — V2's approval gate is the first real consumer.                |
| Evaluation datasets / harness                       | Needs enough real decisions logged first to know what "accurate" means here.                  |
| Ambiguity / complexity scoring                      | No caller — nothing branches on them.                                                         |
| Component / tool / agent routers                    | V4's component resolver is the natural first owner of a component classifier, not V1.2.       |
| A verification engine                               | Distinct problem (did the generated code satisfy the request), belongs with V2/V4's verify tier. |
| Real enforcement of `"review"`                      | V2 owns approvals, worktrees, and the diff view this would need to mean anything.             |
| A decision debug UI                                 | Nothing to debug yet beyond a JSON log line — add a UI once there's a second signal to show.  |

---

## Files this version touches

```
NEW  packages/decision-engine/package.json
NEW  packages/decision-engine/tsconfig.json
NEW  packages/decision-engine/src/types.ts       Decision/ExecutionMode + zod schemas
NEW  packages/decision-engine/src/classify.ts    classify() — one Provider call, falls open
NEW  packages/decision-engine/src/policy.ts      resolvePolicy() — two rules
NEW  packages/decision-engine/src/index.ts
NEW  packages/decision-engine/test/policy.test.ts
NEW  packages/decision-engine/test/classify.test.ts
EDIT apps/api/package.json                       @repo/decision-engine dependency
EDIT apps/api/src/routes/conversation.ts         classify + log, before runAgentLoop
```

---

## Traps

| Trap                                          | Symptom                                                        | Fix                                                                 |
| ---------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Classification treated as a hard dependency    | A model hiccup on the classify call takes down the real agent turn | Falls open to a fixed `medium`-risk `"unknown"` decision, never throws |
| Scope creep back to the original 56-section spec | Every future session reaches for the deferred table above          | Cut list lives in this doc with a reason each — read it before adding    |
| `"review"` implicitly treated as a real gate   | Someone wires UI or blocking behavior off a label V2 hasn't built | `"review"` does nothing yet — it's a log field until V2 exists          |

---

## Concepts to learn here

LLM-as-classifier · fail-open auxiliary signals · scope discipline via a written cut list.
See [CRASH_COURSE.md](../CRASH_COURSE.md#llm-as-classifier).

---

## Definition of done

- [x] `packages/decision-engine` classifies intent/changeType/risk and resolves a two-mode policy.
- [x] Wired into `POST /conversation`, observation-only, `runAgentLoop` unchanged.
- [x] `bun test packages/decision-engine` green, `tsc --noEmit` clean in both packages touched.
- [x] A live run against the real provider, confirming the two acceptance-test prompts classify as
      expected outside of the scripted `FakeProvider` tests — done 2026-09-22, see Result above.

**Reopened scope ([D64](../DECISIONS.md)), definition of done for Slices 2–7:**

- [x] Five-mode `ExecutionMode` (`direct`/`tool`/`agent`/`review`/`blocked`) with a real
      `resolvePolicy()`, `Decision` enriched with `route`/`component`/`complexity`/`ambiguity`.
- [x] `POST /conversation` actually branches on `policy.mode` — `"blocked"` never reaches the model,
      `"direct"` skips `planTasks()` — verified live end-to-end against a real running API, not just
      type-checked.
- [x] `component` grounded in `@repo/ui-system`'s live registry — schema-rejects any name not
      actually registered.
- [x] A retry/loop-detection policy for the existing `tsc` verify loop, decided by a tested pure
      function, not inline heuristics in the route handler.
- [x] The real "LLM calls avoided" signal (`plannerSkipped`) and verification give-ups are both
      structured log fields, not just inferable from chat messages.
- [x] An eval suite that calls the real provider and reports policy accuracy plus an under-cautious
      (safety) count — 15/15 policy accuracy, 0 under-cautious, as of 2026-09-23.
- [x] Every slice's deliberately-skipped pieces are named with a specific reason in `DECISIONS.md`
      (D64–D70), not silently dropped — cache, decision trace, provider health/fallback, the
      question-type union, a component family taxonomy, and a Tier 2 requirement/scope checker.
