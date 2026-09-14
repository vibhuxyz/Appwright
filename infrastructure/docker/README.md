# infrastructure/docker/

One folder per service. **The build context is always the repo root**, never this folder:

```bash
docker build -f infrastructure/docker/api/Dockerfile   -t appwright-api   .    # ← note the trailing dot
docker build -f infrastructure/docker/web/Dockerfile   -t appwright-web   .
docker build -f infrastructure/docker/workers/Dockerfile -t appwright-workers .
```

`docker-compose.yml` does the same thing — `context: .` plus `dockerfile: infrastructure/docker/<svc>/Dockerfile`.

Why root context: these are workspace builds. The API image needs `packages/*`. A context scoped
to one service couldn't see them.

| File                 | Base                     | Runs                                                                                                         |
| -------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `api/Dockerfile`     | `oven/bun:1.3.13-alpine` | `bun --filter api start`                                                                                     |
| `web/Dockerfile`     | `oven/bun:1.3.13-alpine` | Vite dev server                                                                                              |
| `workers/Dockerfile` | `oven/bun:1.3.13-alpine` | one image, `command:` picks ingestion/indexing/evaluation/maintenance — `docker compose --profile events up` |
| `orchestrator/`      | —                        | empty on purpose, see its `README.md`                                                                        |

---

## Four rules these files follow

**1. The CMD is the same command you run locally.**

No flags duplicated between docs and the Dockerfile. Each image's `CMD`/`command:` is the same
`bun --filter <name> start` you'd run on your laptop. If you find yourself writing a
production-only start script, something has gone wrong.

**2. Copy every workspace manifest, not just the ones you import.**

`bun` resolves the _whole_ workspace graph from the root manifest. Miss one member and the install
fails, even if this service never touches it:

```
error: Workspace not found "apps/web"
```

That's a real error this repo hit (against the pre-rename `services/web`). When you add a
workspace member, add its manifest line to every Dockerfile in this folder.

**3. Manifests first, source last.**

```dockerfile
COPY package.json bun.lock* ./
COPY apps/*/package.json ...     ← layer A: dependencies
RUN bun install
COPY apps/api apps/api           ← layer B: source
```

Docker caches layer by layer. Editing source invalidates only layer B, so rebuilds skip the
install. Copy source before installing and every one-character change reinstalls everything.

**4. Never copy `node_modules` or `.venv` from the host.**

`.dockerignore` at the repo root blocks them. Two reasons: the build context drops from **582MB to
~10MB**, and host `node_modules` contain macOS-compiled binaries that segfault in a Linux container.
Dependencies are always installed _inside_ the image, from the lockfile.

---

## Known gaps — these are V3's job

- **Images are fat.** The bun images install _every_ workspace's dependencies, so the API image
  carries React and Vite it never uses. Fix is a multi-stage build plus `--production`. Not worth
  doing until push times actually hurt.
- **No non-root user.** Every container runs as root. Fine locally, not fine in production.
- **`web/Dockerfile` runs the Vite dev server**, not a static build. A production web image would
  `bun --filter web build` and serve the output from nginx or a static host.
- **No health checks in the Dockerfiles.** `/health` exists on api; the platform needs to be
  pointed at it.
- **`docker-compose.yml`'s default services are dev-only** — they bind-mount your laptop's source
  into the containers. `infrastructure/compose/docker-compose.dev.yml` is the same stack,
  path-adjusted, kept here for parity with `docker-compose.prod.yml`'s location — the two are
  **not wired together** (no `include:`, no merge), so a change to one doesn't propagate to the
  other. `docker-compose.prod.yml` is the immutable-image shape, but it still reuses these same
  unoptimized Dockerfiles (see the gap above).
- **The Kafka config under the `events` profile is unverified** — see the comment above it in
  `docker-compose.yml`.

See [`docs/versions/V3_CLOUD_SANDBOX.md`](../../docs/versions/V3_CLOUD_SANDBOX.md).
