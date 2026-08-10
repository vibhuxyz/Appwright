# Writing good code — learned from `ref-ai/packages`

> **How to use this file.** Keep it open while you code. Every pattern below was pulled out of
> `ref-ai/packages` — a real, production-quality agent codebase (142k lines of TypeScript, 438 test
> files). Each entry shows **what they actually wrote**, **why it matters**, and **how to write the
> same thing in Python**, since our engine is Python ([D4](./DECISIONS.md)).
>
> This is not generic "clean code" advice. Every rule here is one they follow consistently, and
> most of them exist because of a specific failure they clearly hit once.

---

## Contents

- [Part 1 — The reading map: which package for which version](#part-1--the-reading-map)
- [Part 2 — The patterns](#part-2--the-patterns)
  1. [Errors are values, not explosions](#1-errors-are-values-not-explosions)
  2. [Discriminated unions everywhere](#2-discriminated-unions-everywhere)
  3. [Ports and adapters — depend on a shape, not a library](#3-ports-and-adapters)
  4. [The event sink — never let a function decide where output goes](#4-the-event-sink)
  5. [Comments explain WHY, never WHAT](#5-comments-explain-why-never-what)
  6. [Name the dangerous case in the function name](#6-name-the-dangerous-case)
  7. [Rich return types, not booleans](#7-rich-return-types-not-booleans)
  8. [Constants with units in the name](#8-constants-with-units-in-the-name)
  9. [Validate at the boundary, then trust](#9-validate-at-the-boundary)
  10. [Cancellation is a parameter, not an afterthought](#10-cancellation-is-a-parameter)
  11. [Always clean up in `finally`](#11-always-clean-up-in-finally)
  12. [Strategy is per-item, not a global flag](#12-strategy-is-per-item)
  13. [Fake the LLM in tests](#13-fake-the-llm-in-tests)
  14. [Docstrings state the contract AND the caveat](#14-docstrings-state-the-contract-and-the-caveat)
- [Part 3 — The Python checklist](#part-3--the-python-checklist)

---

# Part 1 — The reading map

**`ref-ai/` is READ-ONLY reference. Do not delete any of it.** Different parts become relevant at
different versions — most of it you don't need yet, and won't understand the point of until you do.

| Package | Lines | What it is | Read it at |
|---|---|---|---|
| `packages/agent` | 12k | **The harness.** Loop, tools, session storage, compaction, telemetry, state machine | **V0** → V5 |
| `packages/ai` | 23k | Unified LLM API: provider adapters, auth, token/cost tracking | **V0**, V1 |
| `packages/protocol` | 1.2k | Runtime-neutral schemas, CBOR encoding, byte-stream framing | V1 (streaming), Track B |
| `packages/client` | 1.2k | Transport-neutral client. **No Node imports at all** | V1 (the API↔agent boundary) |
| `packages/server` | 2.3k | Session server | V1, V3 |
| `packages/session-backends` | — | Pluggable session storage | V1 (persistence) |
| `packages/telemetry` | 0.9k | Vendor-neutral telemetry contracts | V3, V5 |
| `packages/coding-agent` | 59k | The full product: sessions, settings, extensions, modes | V2, V4 |
| `packages/evals` | 1.3k | Model-backed behavioural checks | **V5** (this is how you measure the healer) |
| `packages/tui` | 16k | Terminal UI framework | Skip — we're building a web UI |

### What to read, per version

**V0 — the loop.** This is the one that matters most. Read in this order:

```
1. packages/agent/src/agent-loop.ts          THE loop. 796 lines. Read it twice.
2. packages/agent/src/harness/events.ts      how events are typed and dispatched
3. packages/agent/src/harness/result.ts      63 lines. The error model. Read it first, actually.
4. packages/agent/src/harness/tools/bash.ts  what a good tool looks like
5. packages/agent/src/harness/tools/read.ts  + edit.ts — the file tools
6. packages/agent/src/harness/utils/truncate.ts   context-window discipline
7. packages/agent/src/harness/env/nodejs.ts  ports & adapters (skim; matters at V3)
8. packages/agent/test/agent-loop.test.ts    how to test a loop without a real LLM
```

**V1 — persistence + streaming.**
`packages/agent/src/harness/session/` (the whole directory — `types.ts` is the port, `jsonl/` and
`memory.ts` are two adapters implementing it) · `packages/protocol` · `packages/client`.

**V2 — isolation & control.**
`packages/agent/src/harness/tools/file-mutation-queue.ts` (concurrent writes) ·
`packages/agent/src/harness/reducer.ts` (state machine + corruption detection) ·
`packages/agent/docs/harness-v2-state-machine.md` (1200 lines of design doc — read this before
building approvals).

**V3 — cloud sandbox.**
`packages/agent/src/harness/env/nodejs.ts` — **this is the pattern our `SandboxProvider` copies.**
Also `packages/telemetry`.

**V4 — planner.** `packages/coding-agent/src/core/agent-session.ts` (3.3k lines — how a real
session orchestrates multi-step work).

**V5 — autonomy.** `packages/evals` — behavioural checks are how you prove the healer works
instead of guessing.

**Their own design docs are worth more than most blog posts:**
`packages/agent/docs/harness-v2.md` (4.6k lines), `harness-v2-state-machine.md`,
`harness-v2-test-matrix.md`, `telemetry-schema.md`.

---

# Part 2 — The patterns

## 1. Errors are values, not explosions

**What they wrote** — `packages/agent/src/harness/result.ts`, the whole file is 63 lines:

```ts
export type Result<TValue, TError> =
  | { ok: true;  value: TValue }
  | { ok: false; error: TError };
```

Then `env/nodejs.ts` returns them instead of throwing:

```ts
function resolveTimeoutMs(timeout: number | undefined): Result<number | undefined, ExecutionError> {
  if (timeout === undefined) return ok(undefined);
  if (!Number.isFinite(timeout) || timeout <= 0) {
    return err(new ExecutionError("timeout", "Invalid timeout: must be a finite number of seconds"));
  }
  ...
}
```

**Why it matters.** Think of a restaurant kitchen. A thrown exception is a waiter shouting across
the room and running out the door — whoever catches it has no idea what dish it was about. A
`Result` is the waiter walking back to your table and saying "the fish is off, pick something
else." The failure is part of the conversation, and you cannot ignore it by accident.

For an agent this is not a style preference. **A tool that throws kills the run. A tool that
returns an error lets the model read it and try again.** That single difference is most of what
makes an agent feel robust.

**In Python:**

```python
from typing import Generic, Literal, TypeVar
from dataclasses import dataclass

T = TypeVar("T"); E = TypeVar("E")

@dataclass(frozen=True, slots=True)
class Ok(Generic[T]):
    value: T
    ok: Literal[True] = True

@dataclass(frozen=True, slots=True)
class Err(Generic[E]):
    error: E
    ok: Literal[False] = False

Result = Ok[T] | Err[E]
```

Used:

```python
async def read_file(path: str) -> Result[str, FileError]:
    resolved = safe_resolve(workspace_id, path)
    if resolved is None:
        return Err(FileError(kind="path_escape", message=f"blocked: {path}"))
    return Ok(await anyio.Path(resolved).read_text())
```

`match` makes it read well:

```python
match await read_file(p):
    case Ok(value=text):  ...
    case Err(error=e):    await emit(tool_error(e))   # the model sees it and recovers
```

**Where to use it:** every tool, every filesystem call, every subprocess. **Where not to:**
genuine programmer bugs. A missing config key at startup should crash — you want to know now.

> Their `TaggedError` (result.ts:28) goes further: every error carries a `_tag` and a `toJSON()`.
> That is what lets an error cross a process boundary and still be matched on. Ours will cross
> Python → HTTP → TypeScript, so we need exactly this. Pydantic models with a `kind: Literal[...]`
> field give it to us for free.

---

## 2. Discriminated unions everywhere

**What they wrote** — `harness/events.ts:1-17`:

```ts
export interface RunStartEvent { type: "run_start"; lane: string; runId: string; }
export interface RunEndEvent   { type: "run_end"; lane: string; runId: string;
                                 outcome: "completed" | "aborted" | "failed"; leafId: string; }

export type HarnessEvent = RunStartEvent | RunEndEvent;
export type HarnessEventOfType<T extends HarnessEventType> = Extract<HarnessEvent, { type: T }>;
```

**Why it matters.** Every event has a `type` field, and the type field decides which other fields
exist. The compiler then refuses to let you read `outcome` off an event that doesn't have one, and
it forces you to handle every case in a `switch`.

The alternative — one big event class with every field optional — means `event.outcome` is
`str | None` everywhere and you find out at runtime, in production, on a Friday.

**In Python:**

```python
from typing import Literal, Annotated
from pydantic import BaseModel, Field

class RunStart(BaseModel):
    type: Literal["run_start"] = "run_start"
    seq: int
    session_id: str

class ToolCallStart(BaseModel):
    type: Literal["tool_call_start"] = "tool_call_start"
    seq: int
    session_id: str
    tool_call_id: str
    tool_name: str
    args: dict

class RunEnd(BaseModel):
    type: Literal["run_end"] = "run_end"
    seq: int
    session_id: str
    outcome: Literal["completed", "aborted", "failed"]

AgentEvent = Annotated[RunStart | ToolCallStart | RunEnd, Field(discriminator="type")]
```

Two things this buys us that a plain `dict` does not:

1. `TypeAdapter(AgentEvent).validate_python(raw)` parses into the *right* class automatically.
2. The exported JSON Schema is a clean `oneOf`, so `make contracts`
   ([D10](./DECISIONS.md#decision-10-pydantic-is-the-source-of-truth-for-cross-language-types--active))
   generates a real TypeScript union instead of `any`.

> **Rule:** if you're about to write a field as `Optional[...]` because "it's only there sometimes",
> stop. That's two types wearing a trenchcoat. Split them.

---

## 3. Ports and adapters

**What they wrote.** `harness/env/nodejs.ts` is 695 lines that implement an `ExecutionEnv`
interface declared somewhere else entirely. The loop and the tools import the *interface*, never
`node:fs`.

```ts
import { type ExecutionEnv, ExecutionError, err, ok, type Result, ... } from "../types.ts";
```

And in the bash tool, notice it never touches a process directly:

```ts
async execute(_toolCallId, { command, timeout }, signal, onUpdate, context) {
  const { env } = context;                      // ← the port, injected
  await executeShellWithCapture(env, execution.command, {...});
}
```

**Why it matters.** Picture a wall socket. Your laptop charger doesn't care whether the electricity
comes from a dam, a reactor, or a solar panel — it cares about the shape of the socket. `ExecutionEnv`
is the socket. `nodejs.ts` is one power station. A test fake is another. A cloud sandbox is a third.

**This is the single most important pattern for us**, because in V3 the same tools must run against
a local filesystem *and* a remote sandbox. If the tools import `pathlib` and `subprocess` directly,
V3 is a rewrite. If they take an `env`, V3 is a new adapter class.

**In Python — use `Protocol`, not `ABC`:**

```python
from typing import Protocol, runtime_checkable

@runtime_checkable
class ExecutionEnv(Protocol):
    cwd: str
    async def read_file(self, path: str) -> Result[str, FileError]: ...
    async def write_file(self, path: str, content: str) -> Result[None, FileError]: ...
    async def exec(self, cmd: list[str], *, timeout: float | None = None) -> Result[ExecOutput, ExecError]: ...
```

Then:

```python
class LocalEnv:      # no inheritance needed — structural typing
    ...
class SandboxEnv:    # V3, talks to E2B
    ...
class FakeEnv:       # tests, in-memory dict
    ...
```

`Protocol` beats `ABC` here because an adapter doesn't have to import the base class to satisfy it.
Your fake in a test file is just a class with the right methods.

**Rule of thumb:** anything that touches the outside world — disk, network, clock, random,
subprocess — goes behind a port. Anything else is pure logic and needs no abstraction at all.

---

## 4. The event sink

**What they wrote** — `agent-loop.ts:25`:

```ts
export type AgentEventSink = (event: AgentEvent) => Promise<void> | void;
```

And it is threaded through *everything*:

```ts
async function runLoop(..., emit: AgentEventSink, ...): Promise<void>
async function streamAssistantResponse(..., emit: AgentEventSink, ...)
async function executeToolCallsSequential(..., emit: AgentEventSink)
async function failToolCallsFromTruncatedMessage(toolCalls, emit)
```

The loop never calls `console.log`. Not once. It calls `await emit(...)`.

**Why it matters.** The loop doesn't know if its output goes to a terminal, a websocket, a log
file, or a test assertion. That's why the same loop serves a CLI *and* a server with no changes.

This is the exact mistake our deleted code made — `devianAgent.ts:263` passed a **no-op `emit`** and
threw the whole stream away. That's why "see code in real time" became a milestone instead of being
free. **In V0 the sink prints; in V1 the identical loop streams to a browser.**

**In Python:**

```python
from collections.abc import Awaitable, Callable
AgentEventSink = Callable[[AgentEvent], Awaitable[None]]

async def run_agent_loop(
    messages: list[Message],
    tools: dict[str, Tool],
    provider: Provider,
    emit: AgentEventSink,
    max_iterations: int = 25,
) -> list[Message]:
    await emit(RunStart(seq=next(seq), session_id=sid))
    ...
```

**The test that tells you you got it right:** can you write a unit test for the loop that collects
events into a list and asserts on them, without patching anything? If yes, the boundary is clean.

```python
events: list[AgentEvent] = []
async def collect(e: AgentEvent) -> None: events.append(e)

await run_agent_loop(msgs, tools, FakeProvider(...), collect)
assert [e.type for e in events] == ["run_start", "tool_call_start", ..., "run_end"]
```

---

## 5. Comments explain WHY, never WHAT

This is the thing their codebase does best, and it's the habit worth stealing hardest.

**Example A** — `agent-loop.ts:208`:

```ts
// A "length" stop means the output was cut off by the token limit, so
// every tool call in the message may carry truncated arguments. Fail
// them all instead of executing potentially borked calls.
const executedToolBatch =
  message.stopReason === "length"
    ? await failToolCallsFromTruncatedMessage(toolCalls, emit)
    : await executeToolCalls(...);
```

You could read that code all day and never work out *why* a length stop invalidates the tool calls.
The comment is the only place that knowledge exists.

**Example B** — `events.ts:88`:

```ts
// Stay in buffering mode while flushing so reentrant emissions preserve order.
while (buffered.length > 0) { ... }
```

Six words that will save you a two-day debugging session.

**Example C** — `env/nodejs.ts:61`, inside an empty `catch`:

```ts
} catch {
  // Keep malformed URLs as ordinary paths so filesystem methods preserve their non-throwing contract.
}
```

An empty `catch` normally screams "someone gave up here." This one documents a deliberate contract.

**Example D** — `reducer.ts:15`, above a type:

```ts
/**
 * Machine-readable category for a contradiction in a lane's durable recovery
 * slice. These indicate states the single-writer record protocol cannot
 * produce, not ordinary operation failures... Restore must reject such states
 * rather than repair or continue it.
 */
```

That comment encodes an **invariant** — "the protocol cannot produce this" — plus the **policy**
— "reject, don't repair." Neither is visible in the code.

**The rule:**

| Write a comment when | Don't write one when |
|---|---|
| The code is surprising and you know why | You're restating the line below |
| There's a non-obvious constraint or invariant | The function name already says it |
| You chose this over an obvious alternative | It's a section header (`# --- helpers ---`) |
| Something looks like a bug but isn't | You're explaining Python itself |

**In Python**, put the *contract* in the docstring and the *surprise* inline:

```python
async def fail_truncated_tool_calls(calls: list[ToolCall], emit: AgentEventSink) -> list[Message]:
    """Fail every tool call from a message the token limit cut off.

    Streamed arguments are finalised by a best-effort JSON salvage parser, so a
    truncated message can produce calls whose args parse and validate but are
    silently incomplete. None are safe to run — report each as an error so the
    model re-issues it.
    """
```

Notice that's their comment from `agent-loop.ts:374`, almost verbatim. It explains a failure mode
you would otherwise have to discover by shipping a bug.

---

## 6. Name the dangerous case

`failToolCallsFromTruncatedMessage`. Twelve syllables, and you know exactly what it does, when it
runs, and that something has gone wrong. Compare `handleEdgeCase` or `processTools2`.

More from their code: `executeToolCallsSequential` / `executeToolCallsParallel` (not
`executeTools(parallel: bool)`), `shouldTerminateToolBatch`, `RecordLogCorruption`,
`resolveTimeoutMs` (the `Ms` tells you the unit).

**In Python**, same instinct:

```python
async def fail_truncated_tool_calls(...)      # not handle_length_stop
def reject_path_outside_workspace(...)        # not check_path
def truncate_to_last_n_lines(...)             # not clean_output
```

If you can't name a function without `handle`, `process`, `manage`, or `do`, you probably haven't
decided what it does yet.

---

## 7. Rich return types, not booleans

**What they wrote** — `utils/truncate.ts:15`. Truncation could have returned `bool`. Instead:

```ts
export interface TruncationResult {
  content: string;
  truncated: boolean;
  truncatedBy: "lines" | "bytes" | null;   /** Which limit was hit */
  totalLines: number;
  totalBytes: number;
  outputLines: number;
  outputBytes: number;
  lastLinePartial: boolean;
  firstLineExceedsLimit: boolean;
  maxLines: number;                         /** The limit that was applied */
  maxBytes: number;
}
```

Every field has a doc comment. The struct carries `maxLines`/`maxBytes` — the limits themselves —
so a caller can render *"showing lines 1801–2000 of 12043 (50KB limit)"* without re-deriving
anything.

And look at how the bash tool uses it — that rich type is what makes this message possible:

```
[Showing lines 1801-2000 of 12043. Full output: /tmp/xyz.log]
```

A `bool` would have given you `[output truncated]`, which helps nobody.

**In Python:**

```python
@dataclass(frozen=True, slots=True)
class Truncation:
    content: str
    truncated: bool
    truncated_by: Literal["lines", "bytes"] | None
    total_lines: int
    output_lines: int
    total_bytes: int
    output_bytes: int
    max_lines: int
    max_bytes: int
```

**Rule:** when a function makes a decision, return *what it decided and why*, not just the outcome.
The caller almost always needs to explain it to a human — or to the model.

---

## 8. Constants with units in the name

`bash.ts:8`:

```ts
const MAX_TIMEOUT_SECONDS = 2_147_483_647 / 1000;
const BASH_UPDATE_THROTTLE_MS = 100;
```

`truncate.ts:11`:

```ts
export const DEFAULT_MAX_LINES = 2000;
export const DEFAULT_MAX_BYTES = 50 * 1024;   // 50KB
export const GREP_MAX_LINE_LENGTH = 500;
```

Three things here: the unit is in the **name** (`_MS`, `_SECONDS`, `_BYTES`), the arithmetic is left
unevaluated (`50 * 1024` reads better than `51200`), and they're at the top of the file where you
can find and tune them.

Unit-in-the-name is not pedantry. `timeout = 30` — seconds or milliseconds? Getting that wrong
gives you a 30-second hang or a 30-millisecond one, and both look like "the network is flaky."

**In Python:** same, module-level, `SCREAMING_SNAKE`.

```python
DEFAULT_MAX_LINES = 2_000
DEFAULT_MAX_BYTES = 50 * 1024
BASH_UPDATE_THROTTLE_MS = 100
MAX_ITERATIONS = 25
```

---

## 9. Validate at the boundary

`bash.ts:41` — a tiny function that runs before anything else happens:

```ts
function validateTimeout(timeout: number | undefined): void {
  if (timeout === undefined) return;
  if (!Number.isFinite(timeout) || timeout <= 0) throw new Error("Invalid timeout: must be a finite number of seconds");
  if (timeout > MAX_TIMEOUT_SECONDS) throw new Error(`Invalid timeout: maximum is ${MAX_TIMEOUT_SECONDS} seconds`);
}

async execute(_toolCallId, { command, timeout }, ...) {
  validateTimeout(timeout);      // ← first line
  ...
}
```

**Why it matters especially for us.** Tool arguments come from an LLM. The model will eventually
send `timeout: -1`, `timeout: "30"`, `timeout: 1e400`, and `path: "../../../../etc/passwd"`. Not
maliciously — just because it's a text predictor having an off day.

**In Python this is nearly free**, because the args model already exists:

```python
from pydantic import BaseModel, Field

class BashArgs(BaseModel):
    command: str = Field(description="Bash command to execute")
    timeout: float | None = Field(default=None, gt=0, le=MAX_TIMEOUT_SECONDS,
                                  description="Timeout in seconds")
```

One model does three jobs: it validates the model's input, it generates the JSON Schema the model is
given, and it documents the tool. That's why tool args are Pydantic models and not `dict`.

**The boundary rule:** validate once, at the edge, then trust the value everywhere inside. Don't
re-check `if path is None` in six nested functions.

---

## 10. Cancellation is a parameter

Look at how many of their signatures carry `signal: AbortSignal | undefined`:

```ts
export function agentLoop(prompts, context, config, signal: AbortSignal | undefined, streamFn)
async function runLoop(..., signal: AbortSignal | undefined, ...)
async function executeToolCallsSequential(..., signal, emit)
```

And it's checked between units of work, not just at the top:

```ts
for (const toolCall of toolCalls) {
  ...
  if (signal?.aborted) break;
}
```

**Why it matters.** A user clicks Stop. An agent run can be a 5-minute chain of LLM calls and
subprocesses. If cancellation isn't threaded through, "stop" means "stop showing me things while
it keeps burning tokens."

**In Python** you get this more cheaply — `asyncio` cancellation propagates through `await` on its
own:

```python
task = asyncio.create_task(run_agent_loop(...))
task.cancel()          # raises CancelledError at the next await point
```

But two things still need care:

```python
# 1. Never swallow it
try:
    await tool.execute(args)
except asyncio.CancelledError:
    raise                       # ← re-raise. Always.
except Exception as e:
    return Err(ToolError(str(e)))

# 2. Subprocesses need explicit killing
try:
    proc = await asyncio.create_subprocess_exec(*cmd, ...)
    await asyncio.wait_for(proc.communicate(), timeout=timeout)
except (asyncio.CancelledError, TimeoutError):
    proc.kill()
    await proc.wait()
    raise
```

> A bare `except Exception:` that catches `CancelledError` is a classic asyncio bug. In Python 3.8+
> `CancelledError` inherits from `BaseException`, not `Exception`, so `except Exception` is safe —
> but `except BaseException` and bare `except:` are not.

---

## 11. Always clean up in `finally`

`bash.ts:107-158` — the whole body is wrapped:

```ts
onUpdate?.({ content: [], details: undefined });
try {
  const capture = getOrThrow(await executeShellWithCapture(...));
  ...
  if (capture.cancelled) throw new Error(appendStatus("Command aborted"));
  if (capture.executionError?.code === "timeout") throw new Error(...);
  if (capture.exitCode !== 0) throw new Error(...);
  return { content: [...], details };
} finally {
  clearUpdateTimer();          // ← runs on success, on error, on abort
}
```

There are four `throw`s and one `return` in that block. The timer is cleared in all five cases,
because it's in `finally`. Without it you leak a timer every time a command fails — and commands
fail constantly.

**In Python**, prefer a context manager over `try/finally` when the cleanup is reusable:

```python
@asynccontextmanager
async def throttled_updates(on_update, interval_ms: int):
    task = asyncio.create_task(_pump(on_update, interval_ms))
    try:
        yield
    finally:
        task.cancel()
        with suppress(asyncio.CancelledError):
            await task
```

Then the tool body has no cleanup code in it at all:

```python
async with throttled_updates(on_update, BASH_UPDATE_THROTTLE_MS):
    return await run_command(...)
```

---

## 12. Strategy is per-item

`agent-loop.ts:419`:

```ts
const hasSequentialToolCall = toolCalls.some(
  (tc) => currentContext.tools?.find((t) => t.name === tc.name)?.executionMode === "sequential",
);
if (config.toolExecution === "sequential" || hasSequentialToolCall) {
  return executeToolCallsSequential(...);
}
return executeToolCallsParallel(...);
```

**Read that carefully.** Each *tool* declares its own `executionMode`. If **any** tool in the batch
says "sequential", the whole batch goes sequential. It is not a global setting the caller guesses
at — the tool that knows it's unsafe to parallelise says so itself, and one such tool poisons the
batch conservatively.

This is the safe direction. `read_file` and `grep` can run together all day. `write_file` and
`bash` cannot — two writes to the same file in parallel is a race, and the whole thing looks like
"the agent randomly corrupts files sometimes."

**In Python:**

```python
class Tool(Protocol):
    name: str
    execution_mode: Literal["parallel", "sequential"]
    async def execute(self, args, ctx) -> ToolResult: ...

async def execute_tool_calls(calls, tools, emit) -> list[Message]:
    if any(tools[c.name].execution_mode == "sequential" for c in calls):
        return await _sequential(calls, tools, emit)
    return await _parallel(calls, tools, emit)
```

And note their parallel version still **emits results in call order** (`agent-loop.ts:540`), even
though execution was concurrent. Non-deterministic transcript ordering is a debugging nightmare —
`asyncio.gather` preserves input order, so use it rather than `as_completed`.

---

## 13. Fake the LLM in tests

`packages/agent/test/agent.test.ts`:

```ts
import { fauxAssistantMessage, fauxToolCall, registerFauxProvider, streamSimple } from "@earendil-works/pi-ai/compat";

const registration = registerFauxProvider({ ... });
const agent = new Agent({ streamFn: streamSimple, ... });
```

They built a **faux provider** into the AI package itself. Tests script exactly what the "model"
returns — a tool call, then text, then a length-stop — and assert on the resulting event sequence.

**Why it matters.** A test that calls a real LLM is slow, costs money, is non-deterministic, and
can't reproduce the interesting cases. How do you test "the response was truncated mid-tool-call"
against a real model? You don't. You fake it.

**In Python:**

```python
class FakeProvider:
    """Scripted provider. Each call returns the next queued response."""
    def __init__(self, responses: list[AssistantMessage]) -> None:
        self._responses = iter(responses)

    async def stream(self, messages, tools, **opts):
        msg = next(self._responses)
        for chunk in _to_chunks(msg):
            yield chunk

async def test_loop_chains_two_tool_calls():
    provider = FakeProvider([
        assistant(tool_calls=[tool_call("read_file", {"path": "a.txt"})]),
        assistant(tool_calls=[tool_call("edit_file", {...})]),
        assistant(text="Done."),                      # no tool calls → loop exits
    ])
    events: list[AgentEvent] = []
    await run_agent_loop(msgs, tools, provider, events.append)
    assert sum(1 for e in events if e.type == "tool_call_start") == 2
```

**Write `FakeProvider` in V0 Slice 2, before the real one.** It is how you test every trap in
V0 — truncation, tool errors, iteration budget, the exit condition — none of which you can trigger
reliably against a real model.

---

## 14. Docstrings state the contract AND the caveat

`agent-loop.ts:56`:

```ts
/**
 * Continue an agent loop from the current context without adding a new message.
 * Used for retries - context already has user message or tool results.
 *
 * **Important:** The last message in context must convert to a `user` or `toolResult` message
 * via `convertToLlm`. If it doesn't, the LLM provider will reject the request.
 * This cannot be validated here since `convertToLlm` is only called once per turn.
 */
```

Three parts: **what** it does, **when** you'd use it, and — the valuable bit — **a precondition
the code cannot check, and why it can't.** That last sentence is the difference between a docstring
and documentation.

They also back it with a runtime guard where they *can* check:

```ts
if (context.messages[context.messages.length - 1].role === "assistant") {
  throw new Error("Cannot continue from message role: assistant");
}
```

**Check what you can, document what you can't, and say which is which.**

**In Python:**

```python
async def continue_agent_loop(ctx: AgentContext, ...) -> list[Message]:
    """Resume a loop from existing context without adding a new message.

    Used for retries — the context already ends in a user message or tool results.

    Precondition (NOT checked here): the last message must convert to a `user` or
    `tool_result` message. If it doesn't, the provider rejects the request. We can't
    validate it because `convert_to_llm` runs once per turn, after this point.

    Raises:
        ValueError: if the context is empty or ends with an assistant message.
    """
    if not ctx.messages:
        raise ValueError("Cannot continue: no messages in context")
    if ctx.messages[-1].role == "assistant":
        raise ValueError("Cannot continue from message role: assistant")
```

---

# Part 3 — The Python checklist

Run through this before you say a file is done.

### Types
- [ ] Every event / message / tool-arg type is a **Pydantic model**, not a `dict`.
- [ ] Unions use `Literal` discriminators + `Field(discriminator=...)`.
- [ ] No `Optional[X]` that really means "two different shapes" — split the type.
- [ ] `mypy --strict` passes (`make types`).

### Errors
- [ ] Tool failures **return** `Err(...)`; they don't raise. The model must be able to read them.
- [ ] Programmer bugs and startup misconfiguration **do** raise.
- [ ] Every error type carries a `kind: Literal[...]` so it survives the trip to TypeScript.
- [ ] No bare `except:`. No `except BaseException:`. `CancelledError` is always re-raised.

### Boundaries
- [ ] Anything touching disk / network / clock / subprocess is behind a `Protocol`.
- [ ] The loop imports no `pathlib`, no `subprocess`, no `httpx` — only its ports.
- [ ] There is a `Fake*` implementation of every port, used by tests.

### Async
- [ ] No blocking calls in async code (`subprocess.run`, `time.sleep`, `requests`, sync file I/O).
- [ ] Subprocesses use `asyncio.create_subprocess_exec` with an **arg list**, never `shell=True`
      on model-supplied input.
- [ ] Every subprocess has a timeout and is killed on cancellation.
- [ ] Parallel work uses `asyncio.gather` (order-preserving), not `as_completed`.

### Cleanup
- [ ] Timers, subprocesses, file handles, and tasks are released in `finally` or a context manager.
- [ ] Reusable cleanup is an `@asynccontextmanager`, not copy-pasted `try/finally`.

### Naming
- [ ] Constants carry their unit: `_MS`, `_SECONDS`, `_BYTES`, `_LINES`.
- [ ] No function called `handle_*`, `process_*`, `manage_*`, or `do_*`.
- [ ] The dangerous path has a name that says it's dangerous.

### Comments
- [ ] Every comment explains **why**, not what.
- [ ] Every non-obvious constraint or invariant is written down.
- [ ] Every deliberate empty `except` says why it's deliberate.
- [ ] Docstrings state preconditions the code can't check — and say it can't.

### Tests
- [ ] `FakeProvider` scripts the LLM. No test hits a real API.
- [ ] The loop is tested by collecting events into a list — no patching, no mocks.
- [ ] The path fence has a test that tries to escape and asserts it fails.
- [ ] Truncation, tool errors, and the iteration budget each have a test.

---

## The one-line version

> **Push decisions into types, push I/O behind ports, return failures instead of throwing them,
> and write down every "why" that isn't visible in the code.**

Everything above is a specific case of that sentence.

---

*See also:* [DECISIONS.md](./DECISIONS.md) · [versions/V0_AGENT_LOOP.md](./versions/V0_AGENT_LOOP.md) ·
[LEARNING_PATH.md](./LEARNING_PATH.md)
