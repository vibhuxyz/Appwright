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
$ bun run agent "read package.json, then add a `clean` script to it"

  ● read_file(package.json)          ✓ 412 bytes
  ● edit_file(package.json)          ✓ +1 −0
  ✓ Added a `clean` script that removes dist/ and node_modules/.
```

**Two chained tool calls in one turn, with zero human input between them.** If you have to
re-prompt after the first tool call, the loop is an `if`, not a `while`, and V0 is not done.

Second test — the loop must terminate:
```
$ bun run agent "what files are in src/?"
  ● list_files(src)                  ✓ 7 entries
  ✓ src/ contains: index.ts, ...
```
One tool call, then a plain answer, then **exit**. No extra LLM round-trip.

---

## Architecture

```
   CLI (bun run agent "..."')          ← V0
   FastAPI POST /run                      ← V1, same loop, different sink
        │
        ▼
   ┌───────────────────────────────────────────────┐
   │  agent_core.run_agent_loop()      libs/ts     │
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
- [x] Language: **TypeScript** ([D4](../DECISIONS.md#decision-4-typescript-end-to-end--active-supersedes-d1)).
- [x] Repo restructured to `services/` + `libs/` + `docker/` ([D12](../DECISIONS.md#decision-12-repo-layout--services--libs--active)).
- [x] `libs/ts/agent-core` + `libs/ts/tools` scaffolded; `services/api` imports both directly.
- [x] No task runner — `package.json` scripts + Docker Compose ([D11](../DECISIONS.md#decision-11-no-task-runner--active-supersedes-d3)).
- [x] `bun install` clean; `bun run agent "…"` and `GET /hello` both work.

### Slice 1 — Message + event types
File: `libs/ts/agent-core/src/types.ts`

- [ ] `Message` — provider-agnostic, one shape for user/assistant/tool.
      Fields: `role`, `type` (`text` | `toolCall` | `toolResponse`), `content`, `toolCallId`, `data`.
- [ ] `AgentEvent` — a **`z.discriminatedUnion("type", […])`**: `agent_start`, `text_delta`,
      `tool_call_start`, `tool_call_end`, `tool_error`, `agent_end`, `error`.
      Every event carries `seq` (monotonic) and `sessionId`.
- [ ] `AgentEventSink = (e: AgentEvent) => void | Promise<void>` — a type alias, not a class.
- [ ] **Define these once, in Zod, and let everyone import them**
      ([D10](../DECISIONS.md#decision-10-one-type-definition-shared-by-import--active-replaces-the-codegen-plan)).
      One definition validates at runtime, infers the static type, and — via `z.toJSONSchema()` —
      produces the schema the model is given.

**Why `seq` now:** stream resume in V1 and handoff in Track B both need "give me everything after
event N". Adding it later means migrating persisted history.

**Why Zod and not a plain `type`:** the agent's inputs come from an LLM and cannot be trusted. A
bare TypeScript type is erased at runtime and validates nothing.

### Slice 2 — Provider abstraction
Directory: `libs/ts/agent-core/src/providers/`

- [ ] `interface Provider { stream(messages, tools, opts): AsyncIterable<ProviderChunk> }`.
- [ ] Implement **one** provider properly first (Anthropic or OpenAI — pick one, ship it).
- [ ] Normalise its tool-call format into the internal `Message` type. That adapter is the entire
      point of the interface.
- [ ] **`FakeProvider` first, before the real one.** Scripted responses, so you can test truncation,
      tool errors, and the exit condition — none of which you can trigger reliably against a real
      model. See [CODE_QUALITY.md §13](../CODE_QUALITY.md).
- [ ] Second real provider only *after* the loop works end to end with the first.
- [ ] API keys from `process.env` via a typed config module; never hardcoded. `.env` is gitignored.

> **Consider installing instead of writing.** `@earendil-works/pi-ai` (`ref-ai/packages/ai`, MIT)
> has 31 provider adapters, auth resolution, and token + cost tracking. Porting the *loop* teaches
> you something; writing your third provider adapter does not.

### Slice 3 — Tools
Directory: `libs/ts/tools/src/`

- [ ] `Tool` = `{ name, description, args: ZodSchema, executionMode, execute(args, ctx) }`.
- [ ] Generate the LLM-facing JSON schema with `z.toJSONSchema(tool.args)` — one source of truth,
      and it validates the model's arguments on the way back in for free.
- [ ] Implement the core set:
  - [ ] `list_files(path)`
  - [ ] `read_file(path)` — with line numbers; truncate huge files
  - [ ] `write_file(path, content)`
  - [ ] `edit_file(path, oldString, newString)` — exact-match replace, error if not unique
  - [ ] `grep(pattern, path)`
  - [ ] `bash(command)` — timeout, captured stdout/stderr, exit code. Pass an **argv array**,
        never `shell: true` with model-supplied input.
- [ ] **Path fence** (`fence.ts`): every filesystem tool resolves through `safeResolve()` and
      rejects anything outside its workspace. **`@repo/contracts/src/utils/projectFiles.ts` already
      implements this correctly** — `workspaceRoot(projectId)` + `safeResolve(projectId, relPath)`.
      **Import it. Do not write a second one.** The API reads the file tree through it; if two
      implementations disagree about what a workspace is, files land where the UI can't see them.
- [ ] Write the fence test **first**: `read_file("../../.env")` must throw, not return your keys.
- [ ] `executionMode: "sequential"` on `write_file`, `edit_file`, and `bash`. Reads stay parallel.
- [ ] Truncate every tool result before it enters message history (a 4 MB file blows the context
      window and your budget).

### Slice 4 — The loop
File: `libs/ts/agent-core/src/loop.ts`

- [ ] `runAgentLoop({ messages, tools, provider, emit, maxIterations = 25, signal })`.
- [ ] `while (true)`: call provider → push assistant message → if no tool calls, **break**.
- [ ] Execute tool calls; push a `toolResponse` for **every** call (a missing one corrupts the next
      request — most providers hard-error).
- [ ] Tool errors are **not** exceptions: catch them and feed the error text back as the tool result
      so the model can recover.
- [ ] Iteration budget → stop with a clear "budget exhausted" event.
- [ ] Truncation: if the provider reports a length stop, **fail every tool call in that message** —
      the arguments may be silently incomplete even when the JSON parses.
- [ ] Parallel only when every tool in the batch allows it (`Promise.all`, order-preserving);
      otherwise sequential.
- [ ] Thread `AbortSignal` through and check it between tool calls.
- [ ] The loop does no I/O of its own beyond `emit` and `tool.execute`. No `console.log`, no `fetch`,
      no `node:fs`.

### Slice 5 — System prompt
- [ ] Write the system prompt in a `.md` file, not a string literal, and load it.
- [ ] Include: the project's file tree (top N entries), the rules (edit don't rewrite, verify before
      claiming success), and the tool-use policy.
- [ ] Keep it short. Long system prompts cost tokens on every single iteration of the loop.

### Slice 6 — CLI harness
File: `libs/ts/agent-core/src/cli.ts`

- [ ] `bun run agent "<prompt>"` — the thinnest possible driver, wiring `emit` to stdout.
- [ ] Render events: tool calls as `● name(args)`, results as `✓/✗`, text deltas streamed inline.
- [ ] `--project <path>` flag so it can run against `templates/vite-react`.
- [ ] **No HTTP in this slice.** The CLI proves the loop works before any server exists. If the loop
      only runs behind a web server, you cannot tell which layer is broken.

### Slice 7 — Prove it
- [ ] Run the acceptance test above against the project template.
- [ ] Run the termination test.
- [ ] Adversarial run: ask for something requiring 5+ tool calls (*"find every component that
      imports React and list them"*). Confirm it completes, and check the iteration count.
- [ ] Deliberately break a tool (bad path) and confirm the agent recovers instead of crashing.
- [ ] `bun test` covers: the fence (escape throws), the loop's exit condition, truncation, and a
      length-stop producing failed tool calls.

---

## Files this version touches

```
NEW  libs/ts/agent-core/src/types.ts        Message · AgentEvent · Tool   (Zod — the definition)
NEW  libs/ts/agent-core/src/loop.ts         runAgentLoop
NEW  libs/ts/agent-core/src/engine/sink.ts  AgentEventSink
NEW  libs/ts/agent-core/src/engine/truncate.ts
NEW  libs/ts/agent-core/src/providers/*.ts  fake · anthropic | openai
EDIT libs/ts/agent-core/src/cli.ts          replace the placeholder with the real driver
NEW  libs/ts/agent-core/prompts/system.md   system prompt
NEW  libs/ts/tools/src/fs.ts                read · write · edit · list
NEW  libs/ts/tools/src/shell.ts             bash
NEW  libs/ts/tools/src/search.ts            grep
NEW  libs/ts/tools/src/fence.ts             re-export safeResolve from @repo/contracts
NEW  libs/ts/agent-core/test/*.test.ts      loop · fence · truncation
READ ref-ai/packages/agent/src/agent-loop.ts    the reference — same language, so port directly
```

---

## Traps

| Trap | Symptom | Fix |
|---|---|---|
| `if` instead of `while` | Agent does one tool call then stops mid-task | The loop is the whole point |
| Missing `toolResponse` | Provider 400s on the next request | Always push one response per call |
| No iteration cap | Agent reads the same file 40× and burns $12 | `maxIterations` + repeated-call detection |
| No-op `emit` | "Real-time streaming" becomes a rewrite later | Wire the sink from day one |
| Untruncated tool results | Context overflow on the 3rd iteration | Truncate everything entering history |
| Tool errors thrown | Whole run dies on a typo'd path | Errors are data — feed them back |
| Path escape | `read_file("../../.env")` leaks your keys | `safeResolve` on every fs tool |
| **`shell: true` on model input** | The fence is irrelevant; the model runs anything | Pass an argv array |
| **Executing a truncated tool call** | Silent corruption — the args parsed but were incomplete | On a length stop, fail every call in the message |
| **Parallel writes** | "The agent randomly corrupts files" | `executionMode: "sequential"` on writes and bash |
| **A plain `type` for tool args** | Erased at runtime; validates nothing | Zod schema, validated at the boundary |

---

## Concepts to learn here

Function calling · agentic loops · async iterators and streaming · provider abstraction ·
Zod → JSON Schema · context-window management. Details in
[LEARNING.md → V0](../LEARNING.md#v0--the-loop).

---

## Definition of done

- [ ] Both acceptance tests pass, repeatedly.
- [ ] `runAgentLoop` is a pure function of `(messages, tools, provider, emit)` — no printing, no
      HTTP, no `node:fs` inside it.
- [ ] Every event carries a `seq`.
- [ ] Path fence verified by a test: the agent cannot read or write outside its workspace.
- [ ] `bun run check-types` and `bun test` are green.
- [ ] A `docs/sessions/SESSION_0N.md` note written up: what was built, what was learned.
