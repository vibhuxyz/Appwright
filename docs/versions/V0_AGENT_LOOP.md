# V0 — Agent Loop

> **Goal:** rebuild the coding agent's core: a loop that calls an LLM, executes tools, feeds the
> results back, and keeps going until the model stops asking for tools.
>
> **Status:** 🔴 not started · **Est.** 1–2 weeks · **Depends on:** nothing

---

## Why this version exists

`apps/opencode/` — which contained a working agent loop — has been deleted from the tree. There
is currently **no agent** in this repo. Everything above (web UI, cloud, planner) is decoration
on top of this loop. Build it first, get it genuinely right, and never rewrite it again.

Reference implementation to port from: **`ref-ai/packages/agent/src/agent-loop.ts`** (796 lines).
It already solves streaming, multi-provider, token truncation, cancellation, and
parallel-vs-sequential tool execution. Read it before writing a line.

**Read these eight files, in this order, before Slice 1:**

```
1. packages/agent/src/harness/result.ts            63 lines. The error model.
2. packages/agent/src/agent-loop.ts                THE loop. Read it twice.
3. packages/agent/src/harness/events.ts            how events are typed and dispatched
4. packages/agent/src/harness/tools/bash.ts        what a good tool looks like
5. packages/agent/src/harness/tools/read.ts + edit.ts
6. packages/agent/src/harness/utils/truncate.ts    context-window discipline
7. packages/agent/src/harness/env/nodejs.ts        ports & adapters (skim now, matters at V3)
8. packages/agent/test/agent-loop.test.ts          testing a loop without a real LLM
```

The patterns in them — and their Python translations — are written up in
**[CODE_QUALITY.md](../CODE_QUALITY.md)**. Keep it open while you write this version.

---

## Acceptance test

```
$ make agent ARGS="read package.json, then add a `clean` script to it"

  ● read_file(package.json)          ✓ 412 bytes
  ● edit_file(package.json)          ✓ +1 −0
  ✓ Added a `clean` script that removes dist/ and node_modules/.
```

**Two chained tool calls in one turn, with zero human input between them.** If you have to
re-prompt after the first tool call, the loop is an `if`, not a `while`, and V0 is not done.

Second test — the loop must terminate:
```
$ make agent ARGS="what files are in src/?"
  ● list_files(src)                  ✓ 7 entries
  ✓ src/ contains: index.ts, ...
```
One tool call, then a plain answer, then **exit**. No extra LLM round-trip.

---

## Architecture

```
   CLI (make agent ARGS='"..."')          ← V0
   FastAPI POST /run                      ← V1, same loop, different sink
        │
        ▼
   ┌───────────────────────────────────────────────┐
   │  agent_core.run_agent_loop()      libs/py     │
   │                                               │
   │   messages[] ──► provider.stream() ──► LLM    │
   │       ▲                  │                    │
   │       │                  ▼                    │
   │       │           has tool_calls?             │
   │       │            │          │               │
   │       │           yes         no ──► return   │
   │       │            │                          │
   │       │            ▼                          │
   │       │      await tool.execute(args)         │
   │       │            │                          │
   │       └────────────┘                          │
   │                                               │
   │   every step ──► await emit(event) ──► sink   │
   └───────────────────────────────────────────────┘
                       │
                       ▼
              AgentEventSink
              (V0: prints to terminal
               V1: streams over SSE to the TS API)
```

**Design rule for V0:** the loop must **not** know where its output goes. It takes an `emit`
callback. In V0 that callback prints; in V1 the exact same loop streams to a browser with no
changes. This single decision is what makes V1 cheap.

> ⚠️ The old code got this wrong — `devianAgent.ts:263` passed a **no-op `emit`** and threw the
> entire event stream away, which is why "see code in real time" was later a whole milestone
> instead of free. Do not repeat it.

---

## TODO

### Slice 0 — Housekeeping ✅ done 2026-08-10
- [x] Language: **Python** ([D4](../DECISIONS.md#decision-4-python-for-the-agent-engine--active-confirms-d1)).
- [x] Repo restructured to `services/` + `libs/` ([D12](../DECISIONS.md#decision-12-repo-layout--services--libs--active)).
- [x] `libs/py/agent_core`, `libs/py/tools`, `services/agent` scaffolded with `pyproject.toml`.
- [x] `uv` workspace at the root; Makefile + Docker Compose replace Turborepo ([D11](../DECISIONS.md#decision-11-docker-compose--makefile-instead-of-turborepo--active-supersedes-d3)).
- [ ] `make install` runs clean, `make types` (mypy + tsc) passes on the empty scaffold.

### Slice 1 — Message + event types
File: `libs/py/agent_core/src/agent_core/types.py`

- [ ] `Message` — provider-agnostic, one shape for user/assistant/tool. Pydantic model.
      Fields: `role`, `type` (`text` | `tool_call` | `tool_response`), `content`, `tool_call_id`, `data`.
- [ ] `AgentEvent` — a discriminated union on `type`: `agent_start`, `text_delta`,
      `tool_call_start`, `tool_call_end`, `tool_error`, `agent_end`, `error`.
      Every event carries `seq` (monotonic) and `session_id`.
- [ ] `AgentEventSink` — a `Protocol` (or `Callable[[AgentEvent], Awaitable[None]]`), not a class.
- [ ] **These Pydantic models are the source of truth for both languages**
      ([D10](../DECISIONS.md#decision-10-pydantic-is-the-source-of-truth-for-cross-language-types--active)).
      Wire up `make contracts` and check that the generated
      `libs/ts/contracts/src/generated/agent-events.ts` looks sane. Do this in Slice 1, not later —
      it is much harder to retrofit once the API is consuming hand-written types.

**Why `seq` now:** stream resume in V1 and handoff in Track B both need "give me everything after
event N". Adding it later means migrating persisted history.

**Python note:** use `Literal` discriminators + `Field(discriminator="type")` so Pydantic parses
the union correctly and the exported JSON Schema is a clean `oneOf`. A loose `dict` here produces
useless TypeScript on the other side.

### Slice 2 — Provider abstraction
Directory: `libs/py/agent_core/src/agent_core/providers/`

- [ ] `class Provider(Protocol)` with
      `def stream(messages, tools, **opts) -> AsyncIterator[ProviderChunk]`.
      Use `Protocol`, not `ABC` — structural typing means an adapter needs no import of the base.
- [ ] Implement **one** provider properly first (Anthropic or OpenAI — pick one, ship it).
- [ ] Normalise its tool-call format into the internal `Message` type. This adapter is the whole
      point of the interface.
- [ ] Second provider only *after* the loop works end to end with the first.
- [ ] API keys via `pydantic-settings` in `services/agent/devian_agent/config.py`; never hardcode.
      `.env` is already gitignored.

### Slice 3 — Tools
Directory: `libs/py/tools/src/devian_tools/`

- [ ] `Tool` = name + description + a **Pydantic args model** + an `execute(args, ctx)` coroutine.
- [ ] Generate the LLM-facing JSON schema with `Model.model_json_schema()` — one source of truth,
      and it validates the model's arguments on the way back in for free.
- [ ] Implement the core set:
  - [ ] `list_files(path)`
  - [ ] `read_file(path)` — with line numbers; truncate huge files
  - [ ] `write_file(path, content)`
  - [ ] `edit_file(path, old_string, new_string)` — exact-match replace, error if not unique
  - [ ] `grep(pattern, path)`
  - [ ] `bash(command)` — timeout, captured stdout/stderr, exit code. Use
        `asyncio.create_subprocess_exec`, never `shell=True` with model-supplied input.
- [ ] **Path fence** (`fence.py`): every filesystem tool resolves through `safe_resolve()` and
      rejects anything outside its workspace. The TypeScript side already implements this correctly
      — `libs/ts/contracts/src/utils/projectFiles.ts` (`workspaceRoot(projectId)` +
      `safeResolve(projectId, relPath)`). **Port its logic; keep identical semantics.** The API
      reads the tree through the TS one, the agent writes through the Python one — if they disagree
      about what a workspace is, files land where the UI can't see them.
- [ ] Write the fence test **first**: `read_file("../../.env")` must raise, not return your keys.
- [ ] Truncate every tool result before it enters message history (a 4 MB file blows the context
      window and your budget).

### Slice 4 — The loop
File: `libs/py/agent_core/src/agent_core/loop.py`

- [ ] `async def run_agent_loop(messages, tools, provider, emit, max_iterations=25) -> list[Message]`.
- [ ] `while True:` call provider → append assistant message → if no tool calls, **break**.
- [ ] Execute tool calls; append a `tool_response` for **every** call (a missing response corrupts
      the next request — most providers hard-error on it).
- [ ] Tool errors are **not** exceptions: catch, and feed the error text back as the tool result so
      the model can recover.
- [ ] Iteration budget → stop with a clear "budget exhausted" event.
- [ ] Handle truncation: if the provider reports a length stop, do not try to parse partial tool JSON.
- [ ] Parallel execution **only** for read-only tools (`asyncio.gather`); writes stay strictly
      sequential.
- [ ] The loop is `async` all the way down and does no I/O of its own beyond `emit` and
      `tool.execute`. No `print`, no HTTP, no file writes.

### Slice 5 — System prompt
- [ ] Write the system prompt in a `.md` file, not a string literal, and load it.
- [ ] Include: the project's file tree (top N entries), the rules (edit don't rewrite, verify before
      claiming success), and the tool-use policy.
- [ ] Keep it short. Long system prompts cost tokens on every single iteration of the loop.

### Slice 6 — CLI harness
File: `services/agent/devian_agent/cli.py`

- [ ] `make agent ARGS='"<prompt>"'` — the thinnest possible driver, wiring `emit` to stdout.
- [ ] Render events: tool calls as `● name(args)`, results as `✓/✗`, text deltas streamed inline.
- [ ] `--project <path>` flag so it can run against `templates/vite-react`.
- [ ] **No FastAPI in this slice.** The CLI proves the loop works before any HTTP exists. If the
      loop only runs behind a web server, you cannot tell which layer is broken.

### Slice 7 — Prove it
- [ ] Run the acceptance test above against the project template.
- [ ] Run the termination test.
- [ ] Adversarial run: ask for something requiring 5+ tool calls (*"find every component that
      imports React and list them"*). Confirm it completes, and check the iteration count.
- [ ] Deliberately break a tool (bad path) and confirm the agent recovers instead of crashing.
- [ ] `pytest` covers: the fence (escape raises), the loop's exit condition, and truncation.

---

## Files this version touches

```
NEW  libs/py/agent_core/src/agent_core/types.py         Message · AgentEvent · Tool  (source of truth)
NEW  libs/py/agent_core/src/agent_core/loop.py          run_agent_loop
NEW  libs/py/agent_core/src/agent_core/engine/sink.py   AgentEventSink protocol
NEW  libs/py/agent_core/src/agent_core/providers/*.py   Anthropic / OpenAI adapters
NEW  libs/py/tools/src/devian_tools/fs.py               read · write · edit · list
NEW  libs/py/tools/src/devian_tools/shell.py            bash
NEW  libs/py/tools/src/devian_tools/fence.py            safe_resolve  ← port from the TS version
NEW  libs/py/tools/src/devian_tools/export_schema.py    feeds `make contracts`
NEW  services/agent/devian_agent/cli.py                 V0 driver
NEW  services/agent/devian_agent/config.py              pydantic-settings
NEW  services/agent/prompts/system.md                   system prompt
GEN  libs/ts/contracts/src/generated/agent-events.ts    from `make contracts` — never hand-edit
READ ref-ai/packages/agent/src/agent-loop.ts                 the reference (TypeScript — port the
                                                        structure, not the syntax)
```

---

## Traps

| Trap | Symptom | Fix |
|---|---|---|
| `if` instead of `while` | Agent does one tool call then stops mid-task | The loop is the whole point |
| Missing `tool_response` | Provider 400s on the next request | Always append one response per call |
| No iteration cap | Agent reads the same file 40× and burns $12 | `max_iterations` + repeated-call detection |
| No-op `emit` | "Real-time streaming" becomes a rewrite later | Wire the sink from day one |
| Untruncated tool results | Context overflow on the 3rd iteration | Truncate everything entering history |
| Tool errors thrown | Whole run dies on a typo'd path | Errors are data, feed them back |
| Path escape | `read_file("../../.env")` leaks your keys | `safe_resolve` on every fs tool |
| **Sync code in the async loop** | One blocking `subprocess.run` freezes every concurrent session | `asyncio` subprocess + `httpx.AsyncClient` |
| **`shell=True` on model input** | The fence is irrelevant; the model just runs anything | `create_subprocess_exec` with an arg list |
| **Hand-writing the TS types** | Silent drift between agent and browser | `make contracts` (D10) |

---

## Concepts to learn here

Function calling · agentic loops · `asyncio` and async iterators · provider abstraction ·
Pydantic → JSON Schema · context-window management. Details in
[LEARNING_PATH.md → V0](../LEARNING_PATH.md#v0--the-loop).

---

## Definition of done

- [ ] Both acceptance tests pass, repeatedly.
- [ ] `run_agent_loop` is a pure function of `(messages, tools, provider, emit)` — no printing, no
      HTTP, no file writes inside it.
- [ ] Every event carries a `seq`.
- [ ] Path fence verified by a test: the agent cannot read or write outside its workspace.
- [ ] `make contracts` produces TypeScript that matches the Pydantic models, and it's committed.
- [ ] `make types` (mypy + tsc) and `make test` are green.
- [ ] A `SESSION_0N.md` note written up: what was built, what was learned.
