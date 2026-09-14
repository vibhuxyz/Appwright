# Build context is the REPO ROOT, not this directory.
#   docker build -f infrastructure/docker/web/Dockerfile .
FROM oven/bun:1.3.13-alpine

WORKDIR /app

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
COPY apps/web apps/web
COPY packages packages

EXPOSE 5173
# --host binds 0.0.0.0 so the dev server is reachable from outside the container.
# NOTE: this is Vite's DEV server. A production web image would run `bun --filter
# web build` and serve the static output — that lands in V3.
CMD ["bun", "--filter", "web", "dev", "--", "--host", "0.0.0.0"]
