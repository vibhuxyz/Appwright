# One image, all four workers — `command:` in docker-compose.yml picks which
# one runs. They're small and share the same dependency graph, so a separate
# image per worker would just be four copies of the same install layer.
#
# Build context is the REPO ROOT, not this directory.
#   docker build -f infrastructure/docker/workers/Dockerfile .
FROM oven/bun:1.3.13-alpine

WORKDIR /app

COPY package.json bun.lock* ./
COPY apps/api/package.json                     apps/api/
COPY apps/web/package.json                     apps/web/
COPY apps/orchestrator/package.json            apps/orchestrator/
COPY packages/agent-core/package.json          packages/agent-core/
COPY packages/tools/package.json               packages/tools/
COPY packages/config/package.json              packages/config/
COPY packages/contracts/package.json           packages/contracts/
COPY packages/db/package.json                  packages/db/
COPY packages/auth/package.json                packages/auth/
COPY packages/cache/package.json               packages/cache/
COPY packages/events/package.json              packages/events/
COPY packages/logger/package.json              packages/logger/
COPY packages/eslint-config/package.json       packages/eslint-config/
COPY packages/typescript-config/package.json   packages/typescript-config/
COPY packages/ui-system/package.json           packages/ui-system/
COPY workers/ingestion/package.json            workers/ingestion/
COPY workers/indexing/package.json             workers/indexing/
COPY workers/evaluation/package.json           workers/evaluation/
COPY workers/maintenance/package.json          workers/maintenance/
COPY scripts/package.json                      scripts/

RUN bun install --frozen-lockfile || bun install

COPY packages/contracts packages/contracts
COPY packages/events packages/events
COPY packages/logger packages/logger
COPY workers workers

# No CMD — docker-compose.yml sets `command:` per worker service.
