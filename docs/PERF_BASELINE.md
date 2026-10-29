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

## What the harness does not measure yet

These numbers are not available:
- **Verify rounds per run:** the harness makes one attempt and has no verify-and-repair loop.
- **Planning p75:** `buildBlueprint` time is not recorded separately from the generation.

Phases 5 and 6b need both numbers, so the harness has to record them first.

The harness total cap (`MAX_TOTAL_COST_USD`) adds up `summary.totalCostUsd` from every earlier run folder. Each of those totals already includes the runs before it, so earlier spend is counted more than once.
