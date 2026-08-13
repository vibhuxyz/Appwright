# docker/

One folder per service. **The build context is always the repo root**, never this folder:

```bash
docker build -f docker/api/Dockerfile   -t appwright-api   .    # ← note the trailing dot
docker build -f docker/agent/Dockerfile -t appwright-agent .
docker build -f docker/web/Dockerfile   -t appwright-web   .
```

`docker-compose.yml` does the same thing — `context: .` plus `dockerfile: docker/<svc>/Dockerfile`.

Why root context: these are workspace builds. The API image needs `libs/ts/*`, the agent image
needs `libs/py/*`. A context scoped to one service couldn't see them.

| File | Base | Runs |
|---|---|---|
| `api/Dockerfile` | `oven/bun:1.3.13-alpine` | `bun --filter api start` |
| `agent/Dockerfile` | `python:3.12-slim` + `uv` | `appwright-serve` |
| `web/Dockerfile` | `oven/bun:1.3.13-alpine` | Vite dev server |

---

## Four rules these files follow

**1. The CMD is the same command you run locally.**

No flags duplicated between the Makefile and the Dockerfile. `appwright-serve` reads `HOST`, `PORT`,
and `RELOAD` from the environment — dev sets `RELOAD=1`, production doesn't. One command, two
environments. If you find yourself writing a production-only start script, something has gone wrong.

**2. Copy every workspace manifest, not just the ones you import.**

Both `bun` and `uv` resolve the *whole* workspace graph from the root manifest. Miss one member and
the install fails, even if this service never touches it:

```
error: Workspace not found "services/web"
```

That's a real error this repo hit. When you add a workspace member, add its manifest line to
`api/Dockerfile` and `web/Dockerfile`.

**3. Manifests first, source last.**

```dockerfile
COPY package.json bun.lock* ./
COPY services/*/package.json ...     ← layer A: dependencies
RUN bun install
COPY services/api services/api       ← layer B: source
```

Docker caches layer by layer. Editing source invalidates only layer B, so rebuilds skip the
install. Copy source before installing and every one-character change reinstalls everything.

**4. Never copy `node_modules` or `.venv` from the host.**

`.dockerignore` at the repo root blocks them. Two reasons: the build context drops from **582MB to
~10MB**, and host `node_modules` contain macOS-compiled binaries that segfault in a Linux container.
Dependencies are always installed *inside* the image, from the lockfile.

---

## Known gaps — these are V3's job

- **Images are fat.** api and web are ~938MB, agent ~698MB. The bun images install *every*
  workspace's dependencies, so the API image carries React and Vite it never uses. Fix is a
  multi-stage build plus `--production`. Not worth doing until push times actually hurt.
- **No non-root user.** Every container runs as root. Fine locally, not fine in production.
- **`web/Dockerfile` runs the Vite dev server**, not a static build. A production web image would
  `bun --filter web build` and serve the output from nginx or a static host.
- **No health checks in the Dockerfiles.** `/health` exists on api and agent; the platform needs to
  be pointed at it.
- **`docker-compose.yml` is dev-only** — it bind-mounts your laptop's source into the containers
  and enables `--reload`. Production ships an immutable image with no mounts.

See [`docs/versions/V3_CLOUD_SANDBOX.md`](../docs/versions/V3_CLOUD_SANDBOX.md).
