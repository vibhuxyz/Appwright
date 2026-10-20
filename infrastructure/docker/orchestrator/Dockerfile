# Build context is the REPO ROOT, not this directory.
#   docker build -f infrastructure/docker/orchestrator/Dockerfile .
FROM oven/bun:1.3.13-alpine

WORKDIR /app

COPY package.json bun.lock* ./
COPY apps/agent/package.json                   apps/agent/
COPY apps/api/package.json                     apps/api/
COPY apps/web/package.json                     apps/web/
COPY apps/orchestrator/package.json            apps/orchestrator/
COPY packages/agent-core/package.json          packages/agent-core/
COPY packages/auth/package.json                packages/auth/
COPY packages/cache/package.json               packages/cache/
COPY packages/config/package.json              packages/config/
COPY packages/contracts/package.json           packages/contracts/
COPY packages/db/package.json                  packages/db/
COPY packages/decision-engine/package.json     packages/decision-engine/
COPY packages/eslint-config/package.json       packages/eslint-config/
COPY packages/events/package.json              packages/events/
COPY packages/logger/package.json              packages/logger/
COPY packages/planner/package.json             packages/planner/
COPY packages/sandbox/package.json             packages/sandbox/
COPY packages/tools/package.json               packages/tools/
COPY packages/typescript-config/package.json   packages/typescript-config/
COPY packages/ui-system/package.json           packages/ui-system/
COPY packages/verify/package.json              packages/verify/
COPY packages/workspace/package.json           packages/workspace/
COPY workers/ingestion/package.json            workers/ingestion/
COPY workers/indexing/package.json             workers/indexing/
COPY workers/evaluation/package.json           workers/evaluation/
COPY workers/maintenance/package.json          workers/maintenance/
COPY scripts/package.json                      scripts/

RUN bun install --frozen-lockfile || bun install

COPY apps/orchestrator apps/orchestrator
COPY packages packages

RUN addgroup -S appwright && adduser -S appwright -G appwright
USER appwright

CMD ["bun", "--filter", "orchestrator", "start"]
