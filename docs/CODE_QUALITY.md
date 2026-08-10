# How we write code here

> Every rule below was pulled out of **`ref-ai/packages`** — a real, production-quality agent
> codebase: 142k lines of TypeScript across 10 packages, 438 test files, MIT licensed.
>
> Not generic clean-code advice. Each one is a rule they follow consistently, and most exist
> because of a specific failure they clearly hit once. **We write TypeScript too**
> ([D4](./DECISIONS.md)), so these are copy-and-adapt, not translate.
>
> Keep this open while you code.

---

# Part 1 — What to read, and when

**`ref-ai/` is READ-ONLY reference. Never delete it.** Most of it only makes sense once you hit the
problem it solves.

| Package | Lines | What it is | Read at |
|---|---|---|---|
| `agent` | 12k | **The harness.** Loop, tools, sessions, compaction, telemetry, state machine | **V0** → V5 |
| `ai` | 23k | Unified LLM API: 31 provider adapters, auth, token + cost tracking | **V0**, V1 |
| `protocol` · `client` · `session-backends` | 3.7k | Schemas, CBOR framing, transport-neutral client, pluggable storage | V1 |
| `server` | 2.3k | Session server | V1, V3 |
| `telemetry` | 0.9k | Vendor-neutral telemetry contracts | V3, V5 |
| `coding-agent` | 59k | The full product: sessions, settings, extensions, modes | V2, V4 |
| `evals` | 1.3k | Model-backed behavioural checks | **V5** — how you prove the healer works |
| `tui` | 16k | Terminal UI | Skip — we're building for the web |

**Their design docs beat most blog posts:** `packages/agent/docs/harness-v2.md` (4.6k lines),
`harness-v2-state-machine.md`, `harness-v2-test-matrix.md`, `telemetry-schema.md`.

### V0 — read these eight, in order

```
1. packages/agent/src/harness/result.ts        63 lines. The error model. Start here.
2. packages/agent/src/agent-loop.ts            THE loop. 796 lines. Read it twice.
3. packages/agent/src/harness/events.ts        how events are typed and dispatched
4. packages/agent/src/harness/tools/bash.ts    what a good tool looks like
5. packages/agent/src/harness/tools/read.ts + edit.ts
6. packages/agent/src/harness/utils/truncate.ts   context-window discipline
7. packages/agent/src/harness/env/nodejs.ts    ports & adapters (skim now, matters at V3)
8. packages/agent/test/agent-loop.test.ts      testing a loop without a real LLM
```

### You can install some of it

`@earendil-works/pi-ai` and `@earendil-works/pi-agent-core` are **published, MIT-licensed npm
packages**. The honest split:

- **Port the loop yourself** — that's the thing worth learning.
- **Install the provider layer** — 31 adapters, auth, token + cost tracking. Writing your third
  provider adapter teaches you nothing.

---

# Part 2 — The rules

## 1. Errors are values, not explosions

`harness/result.ts` — the whole file is 63 lines:

```ts
export type Result<TValue, TError> =
  | { ok: true;  value: TValue }
  | { ok: false; error: TError };
```

`env/nodejs.ts` returns them instead of throwing:

```ts
function resolveTimeoutMs(timeout: number | undefined): Result<number | undefined, ExecutionError> {
  if (timeout === undefined) return ok(undefined);
  if (!Number.isFinite(timeout) || timeout <= 0) {
    return err(new ExecutionError("timeout", "Invalid timeout: must be a finite number of seconds"));
  }
  return ok(timeout * 1000);
}
```

**Why it matters.** A thrown exception is a waiter shouting across the room and running out the
door — whoever catches it has no idea what dish it was about. A `Result` is the waiter coming back
to your table: *"the fish is off, pick something else."*

For an agent this isn't style. **A tool that throws kills the run. A tool that returns an error
lets the model read it and try again.** That single difference is most of what makes an agent feel
robust.

Their `TaggedError` (result.ts:28) adds a `_tag` and `toJSON()` to every error, so it survives
serialisation and can still be matched on. We need that the moment errors cross SSE to the browser
— a Zod-discriminated error union gives it to us.

**Use it for:** every tool, every filesystem call, every subprocess.
**Not for:** genuine programmer bugs. A missing API key at startup should throw — you want to know
now.

---

## 2. Discriminated unions everywhere

`harness/events.ts`:

```ts
export interface RunStartEvent { type: "run_start"; lane: string; runId: string; }
export interface RunEndEvent   { type: "run_end"; lane: string; runId: string;
                                 outcome: "completed" | "aborted" | "failed"; leafId: string; }

export type HarnessEvent = RunStartEvent | RunEndEvent;
export type HarnessEventOfType<T extends HarnessEventType> = Extract<HarnessEvent, { type: T }>;
```

The `type` field decides which other fields exist. TypeScript then refuses to let you read
`outcome` off an event that doesn't have one, and forces you to handle every case in a `switch`.

The alternative — one big type with everything optional — means `event.outcome` is
`string | undefined` everywhere, and you find out at runtime, in production, on a Friday.

**Ours uses Zod**, because agent input is untrusted and we want runtime validation *and* the static
type from one definition:

```ts
const RunStart = z.object({ type: z.literal("run_start"), seq: z.number(), sessionId: z.string() });
const ToolCallStart = z.object({
  type: z.literal("tool_call_start"), seq: z.number(), sessionId: z.string(),
  toolCallId: z.string(), toolName: z.string(), args: z.unknown(),
});

export const AgentEvent = z.discriminatedUnion("type", [RunStart, ToolCallStart, /* … */]);
export type AgentEvent = z.infer<typeof AgentEvent>;
```

One definition, three jobs: validates at runtime, infers the static type, and `z.toJSONSchema()`
produces the schema the model is given. See [D10](./DECISIONS.md).

> **Rule:** about to make a field optional because *"it's only there sometimes"*? Stop. That's two
> types wearing a trenchcoat. Split them.

---

## 3. Ports and adapters

`harness/env/nodejs.ts` is 695 lines implementing an `ExecutionEnv` interface declared elsewhere.
The loop and the tools import the **interface**, never `node:fs`:

```ts
async execute(_toolCallId, { command, timeout }, signal, onUpdate, context) {
  const { env } = context;                      // ← the port, injected
  await executeShellWithCapture(env, execution.command, { … });
}
```

**Why it matters.** A wall socket. Your charger doesn't care whether the electricity comes from a
dam or a solar panel — it cares about the shape of the socket.

**This is the most important pattern for us.** At V3 the same tools must run against a local
filesystem *and* a remote sandbox. Import `node:fs` directly and V3 is a rewrite. Take an `env` and
V3 is a new class.

```ts
export interface ExecutionEnv {
  cwd: string;
  readFile(path: string): Promise<Result<string, FileError>>;
  writeFile(path: string, content: string): Promise<Result<void, FileError>>;
  exec(cmd: string[], opts?: { timeoutMs?: number }): Promise<Result<ExecOutput, ExecError>>;
}

class LocalEnv   implements ExecutionEnv { … }   // V0
class SandboxEnv implements ExecutionEnv { … }   // V3 — E2B
class FakeEnv    implements ExecutionEnv { … }   // tests, in-memory
```

**Rule of thumb:** anything touching disk, network, clock, randomness, or a subprocess goes behind
a port. Everything else is pure logic and needs no abstraction at all.

---

## 4. The event sink

`agent-loop.ts:25`:

```ts
export type AgentEventSink = (event: AgentEvent) => Promise<void> | void;
```

Threaded through *everything* — `runLoop`, `streamAssistantResponse`, `executeToolCallsSequential`,
`failToolCallsFromTruncatedMessage`. **The loop never calls `console.log`. Not once.**

That's why the same loop serves a CLI *and* a server unchanged. It's exactly the mistake our
deleted code made — `devianAgent.ts:263` passed a **no-op `emit`** and threw the stream away, which
is why "see code in real time" became a milestone instead of being free.

**The test that proves you got it right** — no mocks, no patching:

```ts
const events: AgentEvent[] = [];
await runAgentLoop({ messages, tools, provider: fake, emit: (e) => { events.push(e); } });
expect(events.map((e) => e.type)).toEqual(["run_start", "tool_call_start", …, "run_end"]);
```

---

## 5. Comments explain WHY, never WHAT

The habit worth stealing hardest.

**A** — `agent-loop.ts:208`:
```ts
// A "length" stop means the output was cut off by the token limit, so
// every tool call in the message may carry truncated arguments. Fail
// them all instead of executing potentially borked calls.
```
You could read that code all day and never work out why a length stop invalidates the tool calls.
The comment is the only place that knowledge exists.

**B** — `events.ts:88`:
```ts
// Stay in buffering mode while flushing so reentrant emissions preserve order.
```
Six words that save a two-day debugging session.

**C** — `env/nodejs.ts:61`, inside an empty `catch`:
```ts
} catch {
  // Keep malformed URLs as ordinary paths so filesystem methods preserve their non-throwing contract.
}
```
An empty `catch` normally screams *"someone gave up here."* This one documents a contract.

**D** — `reducer.ts:15` encodes an **invariant** (*"these are states the protocol cannot produce"*)
and a **policy** (*"reject, don't repair"*). Neither is visible in the code.

| Write a comment when | Don't when |
|---|---|
| The code is surprising and you know why | You're restating the line below |
| There's a non-obvious constraint or invariant | The function name already says it |
| You chose this over an obvious alternative | It's a section header |
| Something looks like a bug but isn't | You're explaining the language |

---

## 6. Name the dangerous case

`failToolCallsFromTruncatedMessage`. You know what it does, when it runs, and that something has
gone wrong. Compare `handleEdgeCase`.

More: `executeToolCallsSequential` / `executeToolCallsParallel` (not `executeTools(parallel: bool)`)
· `shouldTerminateToolBatch` · `RecordLogCorruption` · `resolveTimeoutMs` (unit in the name).

If you can't name a function without `handle`, `process`, `manage`, or `do`, you haven't decided
what it does yet.

---

## 7. Rich return types, not booleans

`utils/truncate.ts` could have returned `boolean`. Instead, eleven documented fields:

```ts
export interface TruncationResult {
  content: string;
  truncated: boolean;
  truncatedBy: "lines" | "bytes" | null;
  totalLines: number; totalBytes: number;
  outputLines: number; outputBytes: number;
  lastLinePartial: boolean; firstLineExceedsLimit: boolean;
  maxLines: number; maxBytes: number;      // the limits that were applied
}
```

That richness is what makes this possible:

```
[Showing lines 1801-2000 of 12043. Full output: /tmp/xyz.log]
```

A `boolean` gives you `[output truncated]`, which helps nobody — least of all the model.

**Rule:** when a function makes a decision, return *what it decided and why*. The caller almost
always has to explain it to a human, or to the LLM.

---

## 8. Constants carry their unit

```ts
const MAX_TIMEOUT_SECONDS = 2_147_483_647 / 1000;
const BASH_UPDATE_THROTTLE_MS = 100;
export const DEFAULT_MAX_BYTES = 50 * 1024;      // reads better than 51200
```

`timeout = 30` — seconds or milliseconds? Get it wrong and you have a 30-second hang or a
30-millisecond one. Both look like *"the network is flaky."*

---

## 9. Validate at the boundary, then trust

`bash.ts:41`, the first line of `execute`:

```ts
function validateTimeout(timeout: number | undefined): void {
  if (timeout === undefined) return;
  if (!Number.isFinite(timeout) || timeout <= 0) throw new Error("Invalid timeout: …");
  if (timeout > MAX_TIMEOUT_SECONDS) throw new Error(`Invalid timeout: maximum is …`);
}
```

**Tool arguments come from an LLM.** It will eventually send `timeout: -1`, `timeout: "30"`,
`timeout: 1e400`, and `path: "../../../../etc/passwd"` — not maliciously, just because it's a text
predictor having an off day.

With Zod it's nearly free, and the same schema documents the tool to the model:

```ts
const bashArgs = z.object({
  command: z.string().describe("Bash command to execute"),
  timeout: z.number().positive().max(MAX_TIMEOUT_SECONDS).optional()
           .describe("Timeout in seconds"),
});
```

Validate once, at the edge. Don't re-check the same value in six nested functions.

---

## 10. Cancellation is a parameter

`signal: AbortSignal | undefined` runs through every signature — and is checked *between* units of
work, not only at the top:

```ts
for (const toolCall of toolCalls) {
  …
  if (signal?.aborted) break;
}
```

A user clicks Stop. A run can be five minutes of LLM calls and subprocesses. Without threading the
signal, "stop" means *"stop showing me things while it keeps burning tokens."*

---

## 11. Always clean up in `finally`

`bash.ts` has four `throw`s and one `return` in its body. The timer is cleared in all five cases:

```ts
try {
  …
  if (capture.cancelled) throw new Error(…);
  if (capture.exitCode !== 0) throw new Error(…);
  return { content: […], details };
} finally {
  clearUpdateTimer();
}
```

Without it you leak a timer every time a command fails — and commands fail constantly.

---

## 12. Strategy is per-item, not a global flag

`agent-loop.ts:419`:

```ts
const hasSequentialToolCall = toolCalls.some(
  (tc) => tools?.find((t) => t.name === tc.name)?.executionMode === "sequential",
);
if (config.toolExecution === "sequential" || hasSequentialToolCall) return executeToolCallsSequential(…);
return executeToolCallsParallel(…);
```

Each **tool** declares its own `executionMode`. If **any** tool in the batch says sequential, the
whole batch goes sequential. The tool that knows it's unsafe says so — the caller doesn't guess,
and one such tool poisons the batch conservatively.

`read_file` and `grep` can run together all day. `write_file` and `bash` cannot — two writes to one
file in parallel is a race, and it looks like *"the agent randomly corrupts files sometimes."*

Their parallel path still **emits results in call order** (`agent-loop.ts:540`) even though
execution was concurrent. Non-deterministic transcript ordering is a debugging nightmare —
`Promise.all` preserves order.

---

## 13. Fake the LLM in tests

`packages/agent/test/agent.test.ts`:

```ts
import { fauxAssistantMessage, fauxToolCall, registerFauxProvider, streamSimple }
  from "@earendil-works/pi-ai/compat";
```

They built a **faux provider into the AI package itself**. Tests script exactly what the "model"
returns — a tool call, then text, then a length-stop — and assert on the event sequence.

A test that calls a real LLM is slow, costs money, is non-deterministic, and **can't reproduce the
interesting cases.** How do you test "the response was truncated mid-tool-call" against a real
model? You don't.

**Write `FakeProvider` in V0 Slice 2, before the real one.** It's how you test truncation, tool
errors, the iteration budget, and the exit condition.

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

What it does, when to use it, and — the valuable bit — **a precondition the code cannot check, and
why it can't.** Backed by a runtime guard where they *can* check:

```ts
if (context.messages[context.messages.length - 1].role === "assistant") {
  throw new Error("Cannot continue from message role: assistant");
}
```

**Check what you can. Document what you can't. Say which is which.**

---

# Part 3 — Checklist before you call a file done

**Types**
- [ ] Events, messages, and tool args are Zod schemas — not `any`, not a bare interface
- [ ] Unions use `z.discriminatedUnion`
- [ ] No optional field that really means "two different shapes"
- [ ] `bun run check-types` passes

**Errors**
- [ ] Tool failures **return** `err(...)`; they don't throw. The model must be able to read them
- [ ] Programmer bugs and startup misconfiguration **do** throw
- [ ] Every error carries a discriminator so it survives serialisation

**Boundaries**
- [ ] Disk, network, clock, and subprocess access sits behind an interface
- [ ] The loop imports no `node:fs`, no `node:child_process` — only its ports
- [ ] There's a `Fake*` implementation of every port, used by tests

**Async**
- [ ] Every subprocess has a timeout and is killed on abort
- [ ] `AbortSignal` is threaded through and checked between units of work
- [ ] Parallel work uses `Promise.all` (order-preserving)
- [ ] Never `shell: true` with model-supplied input — pass an argv array

**Cleanup**
- [ ] Timers, subprocesses, and handles released in `finally`

**Naming**
- [ ] Constants carry their unit: `_MS`, `_SECONDS`, `_BYTES`, `_LINES`
- [ ] No `handle*` / `process*` / `manage*` / `do*`
- [ ] The dangerous path is named as dangerous

**Comments**
- [ ] Every comment explains **why**
- [ ] Every non-obvious invariant is written down
- [ ] Every deliberate empty `catch` says why
- [ ] Docstrings state preconditions the code can't check

**Tests**
- [ ] `FakeProvider` scripts the LLM. No test hits a real API
- [ ] The loop is tested by collecting events into an array — no mocks
- [ ] The path fence has a test that tries to escape and asserts it fails
- [ ] Truncation, tool errors, and the iteration budget each have a test

---

## The one-line version

> **Push decisions into types, push I/O behind ports, return failures instead of throwing them, and
> write down every "why" that isn't visible in the code.**

Everything above is a case of that sentence.
