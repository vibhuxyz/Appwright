# Performance baseline

Baseline numbers that later speed and routing changes are measured against. Every number here was measured; nothing is estimated.

## Intake analysis latency (Phase 1 done criterion)

Measured 2026-10-29. 10 calls to `analyzePrompt`: 5 follow-up prompts, 2 rounds each, on a project that already has a built app.

| Model | p50 | p75 | max | Routed correctly |
|---|---|---|---|---|
| gemini-3.1-flash-lite | 961 ms | 1081 ms | 1488 ms | 10 / 10 |
| gemini-3.7-flash | 10006 ms | 10011 ms | 10054 ms | 0 / 10 (all provider errors, fell back to keywords) |

Before Phase 1, follow-up messages skipped intake entirely. The added latency is therefore the analyzer call, about 1 s on gemini-3.1-flash-lite.

## Site eval baseline

- **Run:** `baseline-3flash-2026-10-29`
- **Model:** `EVAL_SITE_MODEL=gemini-3-flash-preview`
- **Code:** before Phases 6a and 7 (sequential planning, 2 concurrent tasks)
- **Harness settings:** one attempt per task, no verify-and-repair loop

| Generation | Path | Result | Cost | Duration | Model calls |
|---|---|---|---|---|---|
| A-fashion | task DAG | failed (partial) | $0.136 | 170 s | 41 |
| B-fashion | single-pass | succeeded | $0.159 | 175 s | 40 |
| C-fashion | single-pass | succeeded | $0.122 | 137 s | 27 |
| A-saas | task DAG | failed (partial) | $0.029 | 67 s | 10 |
| B-saas | single-pass | failed (tsc + build) | $0.202 | 199 s | 47 |

The run stopped early after two generations failed in a row, so 7 of 12 combinations did not run.

The earlier `gemini-3.1-flash-lite` run (`baseline-flash-lite-2026-10-29`) failed TypeScript in both generations it ran (A-fashion and B-fashion) before stopping. That model is not used for site evals.

## Planning time, before and after Phase 6a

- **Command:** `bun run eval:site --plan-bench --confirm-spend`, run 2026-10-29.
- **Setup:** `buildBlueprint` with no cached fixtures, 4 briefs × 2 repeats, run one after another, on `gemini-3-flash-preview`.
- **"Before":** a worktree with commits `c61e58b`, `26350fa` and `ae8a2c7` reverted.

| Code | p50 | p75 | max | Failures | Cost |
|---|---|---|---|---|---|
| Before (intent, then content) | 12982 ms | 15216 ms | 19161 ms | 0 / 8 | $0.016 |
| After (intent and content in parallel) | 10466 ms | 11438 ms | 12206 ms | 0 / 8 | $0.016 |

`BUILD_BLUEPRINT_TIMEOUT_MS` is still 180 s. A test requires at least 180 s for reasoning planners, and no reasoning planner has been measured yet.

## Harness notes

- Since `adbe31b`:
  - `--plan-bench` measures planning time.
  - `--repair` runs production retry limits and records repair rounds per generation.
  - The total spend cap counts only the current run.
- Before `adbe31b`, the total cap added up the totals of every earlier run folder, so earlier spend was counted more than once. That is why `baseline-3flash-2026-10-29` shows $5.77 while its own generations cost $0.65.
