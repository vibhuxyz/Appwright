# @repo/agent-core

The agent loop and its types. **No I/O opinions** — no HTTP, no printing, no database.

This package is the product's core algorithm. Everything else is transport.

## Layout

```
src/
├── types.ts           Message, AgentEvent, ToolSpec  (Zod — the source of truth)
├── loop.ts            runAgentLoop()  ← the while-not-if loop
├── cli.ts             the V0 harness — `bun devian "…"`
├── engine/
│   ├── sink.ts        AgentEventSink
│   └── truncate.ts    keep tool results out of the context window
└── providers/
    ├── base.ts        Provider interface
    ├── anthropic.ts
    └── openai.ts
```

## The one rule

`runAgentLoop` takes an `emit` callback and never decides where events go.

```ts
export async function runAgentLoop(opts: {
  messages: Message[];
  tools: Record<string, Tool>;
  provider: Provider;
  emit: AgentEventSink;
  maxIterations?: number;
  signal?: AbortSignal;
}): Promise<Message[]>;
```

In V0 `emit` prints to the terminal. In V1 the same loop streams to a browser with **zero
changes**. That boundary is the whole reason V1 is cheap.

> The deleted `devianAgent.ts:263` got this wrong — it passed a no-op `emit` and threw the event
> stream away, which turned "see code in real time" into a whole milestone. Don't repeat it.

## Who imports this

- `services/api` — V0/V1. Calls the loop directly, in-process. No HTTP hop.
- `services/worker` — from V3. Same import, but running next to a sandbox.

The loop itself never knows which one is calling it.

## Reference

`ref-ai/packages/agent/src/agent-loop.ts` — a complete, working loop, MIT licensed, **in the same
language**. Read it before writing this. Patterns are extracted in
[docs/CODE_QUALITY.md](../../../docs/CODE_QUALITY.md).

`@earendil-works/pi-ai` (`ref-ai/packages/ai`) has 31 provider adapters, auth resolution, and token
+ cost tracking, also MIT. Consider installing it for Slice 2 rather than hand-writing adapters —
writing the loop teaches you something, writing your third provider adapter does not.
