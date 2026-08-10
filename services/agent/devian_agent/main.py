"""FastAPI app for the agent service.

V0 placeholder — it only proves the Python toolchain boots and that the
TypeScript API can reach it over HTTP.

The real endpoint (POST /run, streaming AgentEvents over SSE) arrives in V1.
The loop it will call lives in libs/py/agent_core — see docs/versions/V0_AGENT_LOOP.md.
"""

import os

from fastapi import FastAPI

app = FastAPI(title="devian-agent", version="0.0.0")


@app.get("/health")
async def health() -> dict[str, object]:
    return {"ok": True, "service": "agent"}


@app.get("/hello")
async def hello() -> dict[str, str]:
    return {"message": "hello from the Python agent"}


def serve() -> None:
    """Entry point for the `devian-serve` command.

    The SAME command runs in dev and in production. Only the environment differs:
    dev sets RELOAD=1 to restart on file changes; production doesn't, and binds
    0.0.0.0 inside the container. No second config file, no separate prod script.
    """
    import uvicorn

    uvicorn.run(
        "devian_agent.main:app",
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "8000")),
        reload=os.getenv("RELOAD", "") == "1",
    )
