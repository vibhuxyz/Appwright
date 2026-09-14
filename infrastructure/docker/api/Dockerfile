# Build context is the REPO ROOT, not this directory.
#   docker build -f infrastructure/docker/api/Dockerfile .
FROM oven/bun:1.3.13-alpine

WORKDIR /app

# Copy EVERY workspace manifest before installing.
# Bun resolves the whole workspace graph from the root package.json, so a missing
# member fails the install even if this service never imports it.
# Manifests only (no source) so this layer caches until a dependency changes.
COPY package.json bun.lock* ./
COPY apps/api/package.json                     apps/api/
COPY apps/web/package.json                     apps/web/
COPY apps/orchestrator/package.json            apps/orchestrator/
COPY packages/agent-core/package.json          packages/agent-core/
COPY packages/auth/package.json                packages/auth/
COPY packages/cache/package.json                packages/cache/
COPY packages/tools/package.json               packages/tools/
COPY packages/config/package.json              packages/config/
COPY packages/contracts/package.json           packages/contracts/
COPY packages/db/package.json                  packages/db/
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

# Source last — editing it only invalidates from here down.
COPY apps/api apps/api
COPY packages packages

EXPOSE 3001
# Same script you run locally: `bun --filter api start`
CMD ["bun", "--filter", "api", "start"]
