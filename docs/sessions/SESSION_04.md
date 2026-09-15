# Session 04

**Date:** 2026-09-15
**Goal of the Session:** Resolve unexplained mid-run agent stops, give the UI complete visibility and a one-click resume path when the agent pauses or runs out of tokens, and transition the prompt enhancer from hardcoded prompt strings to a dynamic, self-describing capability registry.

## What We Built

- **Stop Reason Propagation & Persistence (closes O7):**
  - Updated `@repo/agent-core` loop parameters in `apps/api/src/routes/conversation.ts` with an increased token ceiling (`2,000,000` tokens), higher iteration limit (60 turns), and 10-minute deadline.
  - Persisted `data: { stopReason }` on assistant messages in Postgres for `budgetExceeded`, `cancelled`, `maxIterations`, `timeout`, and `fatalError`.
  - Updated `apps/api/src/stream/sse.ts` so `publishStatus` emits `reason` in SSE status frames.
  - Implemented `/conversation/:sessionId/stop` which aborts the controller, sets DB session status to `IDLE` with reason `cancelled`, and broadcasts the status immediately.

- **Reactive Pause / Stop UI Cards with 1-Click Resume:**
  - Added `StopNotice` detection in `apps/web/src/ProjectView.tsx` from both live SSE frames and past message history.
  - Rendered explicit, stylized Pause / Stop notice cards directly above the prompt input:
    - **Out of Tokens / Budget Ceiling:** Amber card explaining the token limit was reached.
    - **Stopped by User:** Neutral card confirming cancellation.
    - **Step Limit / Timeout:** Warning card explaining the iteration or time cap.
    - **Action Button:** Single-click `[ ⏵ Continue Building ]` button that resumes building remaining tasks without manual typing.
  - Replaced misleading "AI Ready" top-bar status with dynamic badges (`⚠️ Paused: Out of tokens`, `⏹ Stopped by user`) with quick resume triggers.

- **Dynamic Capability Registry for Prompt Enhancement (D60):**
  - Added `capabilityHint?: string` to `Tool` in `packages/agent-core/src/loop.ts`.
  - Added capability hints to all tools in `packages/tools/src/index.ts` and exported `describeTools(tools?: Tool[])`.
  - Connected `@repo/tools` and `@repo/ui-system` (`uiSystemPromptSection()`) to `apps/api/src/routes/prompt.ts`.
  - Replaced static prompt strings with `buildDynamicEnhancerSystemPrompt()` so any future tools or UI primitives are auto-discovered at runtime without editing prompt templates.

## What I Implemented Myself

- Highlighted critical UX defects: the agent stopping mid-build with no explanation in the UI, and the user being left with a blank preview and generic "AI Ready" state.
- Identified the architectural flaw of hardcoding tool names and system prompts: asked how the enhancer will discover newly added tools, plugins, or skills in the future.
- Antigravity wrote the SSE protocol updates, DB message persistence, frontend Pause/Resume card UI, tool registry metadata, and dynamic prompt enhancer builder.

## New Concepts Learned

1. **Durable Stop Reasons vs. Transient Exits (O7 resolved):** When a run halts because of token budgets or user cancellation, that state must exist as a durable message attribute and SSE status frame. If it only exists in memory, browser refreshes wipe the context and falsely declare the agent "Ready".
2. **Dynamic Capability Registry over Static Prompting (D60):** Hardcoded tool and library lists in system prompts inevitably drift. Tools and UI primitives must be self-describing contracts (`describeTools()`, `uiSystemPromptSection()`), allowing the prompt enhancer and planner to dynamically assemble the execution environment at runtime.
3. **Headless Browser Dual Loop (Playwright / a11y):** To clone external sites, modern SPAs require a headless browser to extract the filtered a11y tree, computed style palettes, and network payloads (instead of raw 500KB HTML dumps). Post-build, an autonomous Playwright run catches unhandled runtime console errors and tests button interactions before completing.

## Engineering Decisions Made

- **D59 — Stop reasons are persisted message metadata, emitted over SSE, with a resume path in the UI (closes O7).**
- **D60 — Capability-driven Prompt Enhancement: self-describing tool registry and UI vocabulary over static prompt strings.**

## Mistakes I Made

- During frontend refactoring of `apps/web/src/ProjectView.tsx`, the `useSession` hook definition was temporarily omitted, breaking `vite build`. Caught immediately, restored, and verified with `turbo run build` across all 13 workspace packages.

## Homework Before Next Session

- Review Playwright browser automation APIs (`page.accessibility.snapshot()`, `page.on('console')`, `page.on('pageerror')`) for V2/V5 automated E2E verification.

## Next Session Plan

- Proceed with **V2 — Isolation & Control**: git worktrees per session, approval workflows, and structured diff inspection.
