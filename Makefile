# Devian — command surface.
# Turborepo is gone. This file is how you run things; Docker Compose runs the services.
#
#   make install     first-time setup
#   make dev         everything, in containers
#   make agent       just the Python agent (V0 works here, no containers needed)

.DEFAULT_GOAL := help
.PHONY: help install install-ts install-py dev up down logs ps \
        dev-web dev-api dev-agent agent \
        test test-py test-ts lint types contracts db-migrate db-studio clean

# ─── help ────────────────────────────────────────────────────────────────────

help: ## show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

# ─── setup ───────────────────────────────────────────────────────────────────

install: install-ts install-py ## install all deps (TS + Python)

install-ts: ## bun install for the TypeScript workspaces
	bun install

install-py: ## uv sync for the Python workspace
	uv sync

# ─── running ─────────────────────────────────────────────────────────────────

dev: up ## start the whole stack (postgres, redis, api, agent, web)

up: ## docker compose up
	docker compose up -d --build

down: ## docker compose down
	docker compose down

logs: ## tail logs from all services
	docker compose logs -f

ps: ## show running services
	docker compose ps

# Run a single service on the host instead of in a container.
#
# These are ALIASES. The real commands are `devian-serve`, `devian-agent`
# (pyproject [project.scripts]) and `bun --filter <svc> <script>` (package.json).
# Production runs those exact commands — see the Dockerfiles. This file is
# convenience, not the contract. Delete it and nothing breaks.

dev-web: ## vite dev server (host)
	bun --filter web dev

dev-api: ## express api (host)
	bun --filter api dev

dev-agent: ## fastapi agent service (host)
	RELOAD=1 uv run devian-serve

agent: ## run the agent CLI directly — the V0 harness
	uv run devian-agent $(ARGS)

# ─── quality ─────────────────────────────────────────────────────────────────

test: test-py test-ts ## run all tests

test-py: ## pytest
	uv run pytest

test-ts: ## bun test across TS workspaces
	bun test

lint: ## ruff + eslint
	uv run ruff check .
	bun run lint

types: ## mypy + tsc
	uv run mypy services/agent libs/py
	bun run check-types

# ─── contracts ───────────────────────────────────────────────────────────────

contracts: ## regenerate TS types from the Python Pydantic models (see DECISIONS D10)
	uv run python -m devian_tools.export_schema > libs/ts/contracts/src/generated/schema.json
	bunx json-schema-to-typescript \
		libs/ts/contracts/src/generated/schema.json \
		-o libs/ts/contracts/src/generated/agent-events.ts
	@echo "✓ contracts regenerated — commit both files together"

# ─── database ────────────────────────────────────────────────────────────────

db-migrate: ## run prisma migrations
	cd libs/ts/db && bunx prisma migrate dev

db-studio: ## open prisma studio
	cd libs/ts/db && bunx prisma studio

# ─── cleanup ─────────────────────────────────────────────────────────────────

clean: ## remove build output, caches, and venvs
	rm -rf node_modules .venv **/node_modules **/dist **/.vite
	find . -type d -name __pycache__ -prune -exec rm -rf {} +
	find . -type d -name .pytest_cache -prune -exec rm -rf {} +
