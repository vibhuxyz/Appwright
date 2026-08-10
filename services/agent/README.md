# Devian — Python agent service

HTTP/SSE wrapper around the agent loop. Owns transport only.

## Layout

```
devian_agent/
├── main.py        FastAPI app — POST /run (SSE), GET /health
├── cli.py         V0 harness: `make agent ARGS='"add a clean script"'`
├── config.py      pydantic-settings — API keys, WORKSPACES_DIR
└── routes/        thin HTTP layer, no loop logic
```

## Rule

This service must stay thin. The loop lives in `libs/py/agent_core`, the tools in
`libs/py/tools`. If loop logic leaks in here, V3 (running the loop inside a sandbox)
becomes a rewrite instead of a config change.

See [docs/versions/V0_AGENT_LOOP.md](../../docs/versions/V0_AGENT_LOOP.md).
