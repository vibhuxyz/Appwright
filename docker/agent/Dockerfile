# Build context is the REPO ROOT, not this directory.
#   docker build -f docker/agent/Dockerfile .
FROM python:3.12-slim

# uv: fast resolver, and it understands the workspace layout in the root pyproject.toml
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# git is a tool the agent actually uses (worktrees, in V2)
RUN apt-get update && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy EVERY workspace manifest before installing.
# uv resolves the whole workspace from the root pyproject.toml, so a missing
# member fails the sync even if this service never imports it.
# Manifests only (no source) so this layer caches until a dependency changes.
COPY pyproject.toml uv.lock* ./
COPY services/agent/pyproject.toml       services/agent/
COPY libs/py/agent_core/pyproject.toml   libs/py/agent_core/
COPY libs/py/tools/pyproject.toml        libs/py/tools/

RUN uv sync --frozen --no-install-project || uv sync --no-install-project

# Source last — editing it only invalidates from here down.
COPY services/agent services/agent
COPY libs/py libs/py

# Installs the workspace packages themselves, which registers the
# `devian-serve` / `devian-agent` entry points from [project.scripts].
RUN uv sync

ENV PATH="/app/.venv/bin:$PATH"
ENV HOST=0.0.0.0 PORT=8000
EXPOSE 8000

# The same entry point you run locally. No uvicorn flags duplicated here —
# the command reads HOST/PORT/RELOAD from the environment.
CMD ["devian-serve"]
