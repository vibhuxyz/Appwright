# Evals

An eval is an automated test of AI **behaviour**. A unit test asks "does this function return 3?".
An eval asks "given this request, did the AI do the right thing, and how often?". An API key pays
for the model call. It does not measure quality. Quality comes from the cases, the graders and the
numbers you read afterwards.

We write an eval **instead of** a scripted unit test when the thing under test is a model's choice
(which questions to ask, which files to touch, which tool to call). We keep unit tests for code
that always returns the same output for the same input.

---

## Where to use which kind

| Kind                      | Key needed? | Use it for                                                         | Do not use it for                             |
| ------------------------- | ----------- | ------------------------------------------------------------------ | --------------------------------------------- |
| **Unit test**             | No          | Pure functions: retry limits, parsers, budget math, policy tables  | Anything whose result depends on a model      |
| **Schema / shape check**  | No          | Planner and intake output parses with Zod, option counts, caps     | Judging whether an answer is _good_           |
| **Offline eval** (catalog, FakeProvider, saved output) | No | Rules we decided in code: which questions the catalog can ask, contact fields, caps, banned topics | Phrasing, relevance, model-invented questions |
| **Regression eval** (recorded output) | No | A bug we fixed must stay fixed; replay the saved failing input     | New behaviour with no recording yet           |
| **Live eval**             | Yes         | Whether the model's choices fit _this_ request: relevance, counts, redundancy | Every commit. It costs tokens and is noisy |
| **End-to-end agent eval** | Yes         | Prompt → real agent loop → files → typecheck. Catches loop, tool and prompt regressions | Checking one pure function            |
| **AI judge**              | Yes         | Taste: "is this copy persuasive?". Last resort, never the only grader | Anything a regex or typecheck can decide |

Rule of thumb: **use the cheapest grader that can fail the case.** Deterministic graders first
(file exists, `tsc` passes, no hex colours, question count ≤ N). A judge model only when no
deterministic grader can express the rule.

Reading results:

- A live eval is **not deterministic**. Run `--trials 3` before believing a pass or a fail.
- A timeout is not a wrong answer. Report it as "fell back / timed out", not as a quality failure.
- Never weaken a grader to make a case pass. Fix the product, or fix the grader if it was wrong
  (and say which in the commit).

---

## What exists

### 1. Intake questions — `apps/api/evals/intake/`

Checks that the questions asked before a build are the ones that matter for **this** request.
Origin: a "build a landing page for my bootcamp" prompt got 7 questions, including a four-field
contact form, how past work is shown, and the site language, none of which change that build.

| Script                              | Key | What it runs                                                                  |
| ----------------------------------- | --- | ----------------------------------------------------------------------------- |
| `bun run eval:intake:offline`       | No  | Catalog + a `FakeProvider` that returns no questions. Checks banned needs, question cap, contact-field cap |
| `bun run eval:intake`               | Yes | Same cases with a real model. Adds relevance (`mustMention`), catalog-fallback and latency |

Run from `apps/api`. Live runs take `EVAL_MODEL=<model>` (e.g. `deepseek-v4-flash`) and `EVAL_PLAN`.

Each case in `cases.ts` has: `prompt`, `mustNotAsk` (needs the request already answers or that
cannot change the build), `mustMention` (a pattern the questions must cover), `maxQuestions`,
`maxContactFields`.

Principles the cases encode:

1. Ask only what changes what gets built and cannot be inferred from the request.
2. A simple app (todo, landing page) gets at most 4 questions. Only orders, bookings and payments
   justify up to 8.
3. Never ask for a fact the request already states (a named business, an email).
4. Contact fields follow the business: a clinic or bakery needs an address; a marketing page needs
   email and optionally WhatsApp.
5. Language, framework, hosting and visual style are not intake questions.

Last run (`deepseek-v4-flash`, 2026-10-27): **5/6**. The one failure is a 30-second timeout that
fell back to the catalog (`home-planner-service`), not a wrong question.

### 2. Agent builds — `packages/agent-evals/`

Runs the **real agent loop** on a throwaway copy of a template and grades the result.

```
bun packages/agent-evals/src/cli/main.ts --model deepseek-v4-flash --trials 3
  --case vite-counter,next-about-page     pick cases
  --tag smoke                             pick by tag
  --min-pass 0.8                          exit 1 below this overall pass rate
```

Run from the repo root so `.env` loads. Needs a provider key (`GEMINI_API_KEY` or
`DEEPSEEK_API_KEY`). Reports go to `packages/agent-evals/results/` (git-ignored).

Graders (`src/graders/outcome.ts`): `completed`, `typechecks`, `fileContains`, `fileLacks`,
`writtenFilesContain`, `writtenFilesLack`, `onlyWrites`, `writesAtLeast`, `readsBeforeWriting`,
`noToolErrors`, `neverCalls`, `maxToolCalls`, `maxCostUsd`.

Cases: `vite-counter`, `vite-minimal-edit`, `vite-theme-tokens`, `vite-multi-file-feature`,
`next-about-page`.

Baseline (`deepseek-v4-flash`, 2026-10-27, 1–2 trials, small sample): counter ✓, minimal-edit ✓,
about-page ✓, multi-file ✓ (2/2). **`vite-theme-tokens` is 1/2 and still open:** on the failing
trial the pricing page was missing the "Free" and "Team" plan names. Treat as an agent/prompt
problem until three trials say otherwise.

### 3. Decision engine — `packages/decision-engine/evals/`

Live classification accuracy: 15 cases, policy accuracy and an "under-cautious" count
(`bun run eval` in the package). A reporting tool, not a gate (D70).

---

## The loop: eval → correct → record

1. A user reports bad behaviour (a screenshot, a transcript). **Write the case first** with the
   prompt that produced it. Run it. It must fail.
2. Fix the cheapest layer that can fix it: catalog or code rule → model prompt → agent system
   prompt. Prefer a deterministic fix.
3. Re-run the offline eval, then the live eval with `--trials 3`. Run the package's unit tests.
4. If an older unit test asserted the old behaviour, update it in the same change and say so.
5. Record the finding: a line in the relevant section above, and a Decision when the rule is
   one we want kept (D78).

## Adding a case

- Intake: add an object to `INTAKE_EVAL_CASES`. Use the real prompt, typos included.
- Agent build: add an `EvalCase` to `packages/agent-evals/src/cases/` with at least `completed`,
  `typechecks`, and one grader about the _request_ (not just "it compiled").
- Keep caps tight. A cap that nothing can exceed measures nothing.
