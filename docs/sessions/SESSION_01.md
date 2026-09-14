# Session 01

**Date:** 2026-07-14
**Goal of the Session:** Understand the product roadmap, determine the architecture for the MVP, and scaffold the core Agent Engine.

## What We Built

- Scaffolded the Python Agent Engine (`apps/agent-engine`).
- Designed the state machine and Pi-style streaming generator loop (`engine/loop.py`).
- Stubbed out the necessary tools (`tools/filesystem.py`, `terminal.py`, etc.) and agent prompts.
- Established the core architecture bridging the Express Orchestrator and the Python Engine.

## What I Implemented Myself

- Guided the architectural design process.
- Requested the mentor to map out the Appwright graph architecture and scaffold the files.

## New Concepts Learned

- **Event-Driven LLM Loops (Pi-style):** Structuring agent execution as a state machine that yields events continuously, rather than waiting for a single block of generated text.
- **Function Calling / Tool Use Execution:** The mechanical process of how an LLM's JSON output is intercepted, executed by Python on the host OS, and the result is fed back into the prompt context.

## Production Concepts Discussed

- **Sandboxing & State Corruption:** Why we use the Two-Directory Model to prevent the LLM from destroying the pristine template.
- **Token Truncation:** Handling edge cases where an LLM's response stops mid-tool-call due to token limits.

## Engineering Decisions Made

- Separated the Orchestrator (Node.js) from the Brain (Python).
- Selected the Two-Directory local copy model for the V0 MVP instead of a full cloud sandbox.

## Homework Before Next Session

- Review the `engine/loop.py` and `tools/` scaffolding to ensure you understand the flow of data.

## Next Session Plan

- Discuss and implement the Two-Directory Reset logic in the Express backend.
- Write the Python code to actually execute OpenAI/Anthropic tool calls.
