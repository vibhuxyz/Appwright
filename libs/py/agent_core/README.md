# agent_core

The agent loop and its types. **No I/O opinions** — no FastAPI, no HTTP, no printing.

This package is the product's core algorithm. Everything else is transport.

## Layout

```
src/agent_core/
├── types.py           Message, AgentEvent, ToolSpec  (Pydantic — source of truth, see D10)
├── loop.py            run_agent_loop()  ← the while-not-if loop
├── engine/
│   ├── sink.py        AgentEventSink protocol
│   └── truncate.py    keep tool results out of the context window
└── providers/
    ├── base.py        Provider protocol
    ├── anthropic.py
    └── openai.py
```

## The one rule

`run_agent_loop` takes an `emit` callback and never decides where events go.

```python
async def run_agent_loop(
    messages: list[Message],
    tools: list[ToolSpec],
    provider: Provider,
    emit: AgentEventSink,
    max_iterations: int = 25,
) -> list[Message]:
    ...
```

In V0 `emit` prints to the terminal. In V1 the same loop streams to a browser with **zero
changes**. That boundary is the whole reason V1 is cheap.

> The old TypeScript code got this wrong — it passed a no-op `emit` and threw the event stream
> away, which turned "see code in real time" into a whole milestone. Don't repeat it.

## Reference

`ref-ai/tui/src/engine/agentLoop.ts` — a complete, working loop in TypeScript. Read it before
writing this. It already solves streaming, multi-provider, truncation, and parallel-vs-sequential
tool execution.

See [docs/versions/V0_AGENT_LOOP.md](../../../docs/versions/V0_AGENT_LOOP.md).
