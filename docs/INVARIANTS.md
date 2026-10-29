# Invariants

> What must **always** be true. An invariant with no enforcement is a wish — the *Enforced by*
> column says which. Seeded 2026-09-30 from existing decisions ([D71](./DECISIONS.md)); each row
> cites its source. **Status is unverified against code unless marked ✅** — verify on first touch
> and update, per the "code wins" rule.
>
> Statuses: ✅ enforced + tested · 🟡 enforced, no test · ⬜ designed, not built · ❓ unverified

## Agent runtime (V0)

| Invariant | Source | Enforced by | Status |
|---|---|---|---|
| The loop always terminates via one of six named exits, bounded by a loop budget | D26 | `agent-core/loop.ts` | ❓ |
| Tools never touch the filesystem/process directly — only through the `Runtime` seam | D27 | rule: no `node:fs` / `node:child_process` in `packages/agent-core` | ❓ (add a lint/grep check) |
| No tool can resolve a path outside `/workspace`; `.env` is denied explicitly | D15, D28 | path fence · `safeResolve` | ❓ |
| `edit_file` matches exactly or throws — never fuzzy | D16 | `edit_file` | ❓ |
| Tool results are untrusted data, wrapped, never instructions | D23 | `wrapUntrusted` | ❓ |
| Dependencies outside the allowlist are refused | D24 | `deps.allow.json` guard | ❓ |
| No secret ever appears in an LLM prompt | D15 | env-injection at provision time | ⬜ needs a test that greps assembled prompts |
| No code file is written that imports a package absent from `package.json` | D79 | `guardTools` (`tools/src/run-guard`) | ✅ `run-guard.test.ts` |
| An existing file is never overwritten by `write_file` unless it was read in the same run | D79 | `guardTools` | ✅ `run-guard.test.ts` |
| Project memory never exceeds `MAX_PROJECT_MEMORY_BYTES` (1,200) and cannot close its own tag | D80, D86, D33 | `formatProjectMemory` | ✅ `agent-core/test/project-memory.test.ts` |
| Replayed history is at most the last two turns; verification transcripts are omitted, and pure chat is omitted unless it is the current turn | D86, D82 | `historyMessages` | ✅ `apps/agent/test/history-messages.test.ts` |
| A tool result in the loop never exceeds `MAX_TOOL_RESULT_BYTES` (12,288); after a successful edit, earlier reads of that file are a line-count placeholder | D86 | `truncate`, `replaceStaleReads` | ✅ `truncate.test.ts`, `replace-stale-reads.test.ts` |
| A single-pass brief never exceeds `MAX_SINGLE_PASS_BRIEF_BYTES` (24,000); lower-priority prose is dropped first | D86 | `fitBriefLines` | ✅ `blueprint/test/single-pass.test.ts` |
| A revert never deletes uncommitted work; it undoes exactly one saved turn or changes nothing | D83 | `revertTurn` preflight (dirty / not-on-branch / conflict) | ✅ `apps/api/test/revert-turn.test.ts` |
| No `.env*` file except `.env.example` is ever committed by the platform | D83 | `commitTurn` pathspec | ✅ `apps/api/test/revert-turn.test.ts` |
| A reverted turn is not replayed in history and is not listed as confirmed work; memory quotes the request only under the reverted heading | D83, D86 | `isInRevertedTurn` in `formatProjectMemory` and `historyMessages` | ✅ memory + history + `apps/api/test/revert-turn.test.ts` |
| A generated app receives only the pattern files its chosen sections need | D84 | `planPatternDelivery` | ✅ `ui-system/test/patterns.test.ts`, `blueprint/test/design-delivery.test.ts` |
| Every catalog section with code renders its own `data-section` marker and guards motion with reduced motion | D84 | manifest + pattern source | ✅ `ui-system/test/patterns.test.ts` |
| A browser repair runs at most once per turn and never reports a pass the recheck did not measure | D84 | `runBrowserRepair` | ✅ `apps/agent/test/browser-repair.test.ts` |
| Visual-review output is labelled AI judgement and never mixed with measured findings | D84 | `formatRepairPrompt`, `reviewNewPages`, design eval report | ✅ `apps/agent/test/browser-repair.test.ts` |
| A page plans at most one signature effect plus two supporting effects, and delivery ships only those | D85 | `planExperience`, `planPatternDelivery` | ✅ `ui-system/test/experience.test.ts`, `ui-system/test/effects.test.ts` |
| Every effect declares touch, reduced-motion and fallback behaviour, and continuous effects stop off screen | D85 | `EFFECTS` registry + effect source | ✅ `ui-system/test/effects.test.ts` |
| Reduced motion never hides content or causes a hydration mismatch | D85 | `usePrefersReducedMotion`, `useRevealState` | ✅ design eval `content-after-scroll`, `ui-system/test/patterns.test.ts` |
| Only component files are marked `"use client"`, so server pages can import pattern constants | D85 | `readPatternFiles` | ✅ `ui-system/test/patterns.test.ts` |
| A copy-only edit does not start a browser run | D85 | `copyOnlyPaths`, `classifyChange` | ✅ `browser/test/copy-only.test.ts` |
| Project memory never contains another project's data | D80 | `loadProjectMemoryRows` scoped by `projectId` | ✅ `apps/agent/test/project-memory.test.ts` |
| Planned or assumed items are never labelled as confirmed by the user | D80 | label derived from the source table, not a model | ✅ `agent-core/test/project-memory.test.ts` |

## State & events (V1)

| Invariant | Source | Enforced by | Status |
|---|---|---|---|
| Within a session, `seq` is strictly increasing and gap-free per writer; a client reconnecting at `seq N` receives exactly the events `> N` | V1 doc, D44/O12 | `seq` allocation · reconnect buffer | ❓ — **O12 open: breaks with two writers** |
| `text_delta` is never persisted as a row | D45 (amends D40) | event sink | ❓ |
| A persisted stop reason survives refresh | D59 | `Message.data.stopReason` | ❓ |
| Usage/cost increments are atomic (no lost update under concurrency) | V1.1 | Prisma atomic `increment` | ✅ (`apps/api/test/credits.test.ts` covers credits) |

## Decision engine (V1.2)

| Invariant | Source | Enforced by | Status |
|---|---|---|---|
| A `"blocked"` decision never reaches the model | D66 | route branch in `POST /conversation` | ✅ (eval: 0 under-cautious, 15 cases) |
| Classification failure fails **open** to a fixed medium-risk decision, never throws to the user | D63 | classifier fallback | ❓ |
| Risk is never under-estimated relative to policy floor | D31 | eval `0 under-cautious` metric | 🟡 (15 cases — small by design, D70) |

## Planned — must hold once built (write the test *first*)

| Invariant | Version | Source |
|---|---|---|
| **Isolation:** one worktree's writes are never visible in another worktree until merge; chats sharing a worktree run one at a time (D73) | V2 | acceptance test 1, `worktree-busy.test.ts` |
| **Gate:** a tool requiring approval cannot execute before an approve event; deny → loop continues, tool not run | V2 | acceptance test 2, O4 |
| **Verification gates completion:** a run with a failing `tsc` cannot report success | V2 | acceptance test 5 |
| A failed task cannot silently become successful | V3/V4 | D36–D40 |
| A task has **one valid owner** at a time; expired lease ⇒ recoverable; recovered task never double-executes side effects | V3 | D35, D37, D44 |
| Completed tasks never re-execute; dependencies complete before dependents | V4 | D30, D36 |
| Retries are bounded and idempotent | V3/V6 | D44 |
| A restored checkpoint invalidates transcript written after it | V3 | D44 |
| A run's budget is reserved atomically (seat hold), so N concurrent runs cannot each pass the same check | V3 | D45 |
| Plan validation never LLM-repairs; invalid plan is rejected, not patched | V4 | D39 |
