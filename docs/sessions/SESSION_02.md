# Session 02

**Date:** 2026-07-22
**Goal of the Session:** Review the newly provided reference architecture in `ref-ai/tui` and update project documentation.

## What We Built / Explored

- Explored the custom agent loop implemented in `ref-ai/tui/src/engine/agentLoop.ts`.
- Analyzed its core features: robust event streaming (`AgentEventSink`), multi-provider support (OpenAI/Gemini), token truncation handling, and parallel vs. sequential tool execution.
- Updated `PROJECT_ROADMAP.md` and `DECISIONS.md` to reflect this new reference.

## What I Implemented Myself

- Provided the new reference folder and asked for it to be analyzed and documented.

## New Concepts Learned

- **Parallel Tool Execution:** The reference implementation groups tool calls and runs them via `Promise.all()`, which decreases latency compared to strictly sequential execution, but introduces edge cases (race conditions) when tools depend on each other.

## Engineering Decisions Made (Pending)

- **Language Choice Re-evaluation:** The reference architecture is written entirely in TypeScript. We previously scaffolded the engine in Python. We must decide whether to discard the Python scaffold and rewrite the engine in TypeScript to unify the Turborepo stack, or port the TypeScript patterns back to Python.

## Homework Before Next Session

- Decide on the language stack for the Agent Engine (TypeScript vs Python).
