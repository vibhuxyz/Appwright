# Build context is the REPO ROOT, not this directory.
#   docker build -f docker/web/Dockerfile .
FROM oven/bun:1.3.13-alpine

WORKDIR /app

# Copy EVERY workspace manifest before installing.
# Bun resolves the whole workspace graph from the root package.json, so a missing
# member fails the install even if this service never imports it.
# Manifests only (no source) so this layer caches until a dependency changes.
COPY package.json bun.lock* ./
COPY services/api/package.json                 services/api/
COPY services/web/package.json                 services/web/
COPY services/orchestrator/package.json        services/orchestrator/
COPY libs/ts/agent-core/package.json           libs/ts/agent-core/
COPY libs/ts/tools/package.json                libs/ts/tools/
COPY libs/ts/config/package.json               libs/ts/config/
COPY libs/ts/contracts/package.json            libs/ts/contracts/
COPY libs/ts/db/package.json                   libs/ts/db/
COPY libs/ts/eslint-config/package.json        libs/ts/eslint-config/
COPY libs/ts/typescript-config/package.json    libs/ts/typescript-config/
COPY libs/ts/ui/package.json                   libs/ts/ui/

RUN bun install --frozen-lockfile || bun install

# Source last — editing it only invalidates from here down.
COPY services/web services/web
COPY libs/ts libs/ts

EXPOSE 5173
# --host binds 0.0.0.0 so the dev server is reachable from outside the container.
# NOTE: this is Vite's DEV server. A production web image would run `bun --filter
# web build` and serve the static output — that lands in V3.
CMD ["bun", "--filter", "web", "dev", "--", "--host", "0.0.0.0"]
