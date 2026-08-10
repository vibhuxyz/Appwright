# V3 — Cloud Sandbox

> **Goal:** move execution off your laptop. The agent runs inside a disposable, isolated cloud
> sandbox, one per project, for many users, in parallel.
>
> **Status:** 🔴 not started · **Est.** 3–4 weeks · **Depends on:** [V2](./V2_ISOLATION_AND_CONTROL.md)

---

## Why this version exists

This is **the** architectural pivot — the difference between "a coding agent" and "a product".

Three forcing functions:

1. **Security.** An LLM writing `bash` is arbitrary remote code execution. In V0–V2 that
   executes on your machine, as you, with your `~/.ssh` and your `~/.aws`. That is fine for a
   solo dev tool and unacceptable the moment a stranger can sign up.
2. **Availability.** A build must not stop because your laptop slept.
3. **Concurrency.** One machine = one build. A product needs N.

```
        V0–V2                                    V3
┌─────────────────────────┐          ┌─────────────────────────┐
│ API process             │          │ API   (never executes)  │
│   └── agent loop        │          └────────────┬────────────┘
│         └── bash        │                       ▼
│               └── YOUR  │                  ┌─────────┐
│                   DISK  │                  │  Queue  │
└─────────────────────────┘                  └────┬────┘
                                                  ▼
                                          ┌───────────────┐
                                          │ Sandbox Mgr   │
                                          └───────┬───────┘
                                    ┌─────────────┼─────────────┐
                                    ▼             ▼             ▼
                                Sandbox A     Sandbox B     Sandbox C
                                 worker+agent  worker+agent  worker+agent
```

---

## Acceptance test

1. Deployed at a real URL. Sign up as **user A** from a machine that has never seen this repo.
2. Create a project, send a prompt → a sandbox boots → the agent works inside it → the preview
   loads from `https://preview-<id>.<domain>` (not `localhost`).
3. Sign up as **user B**. User B cannot see, read, or reach user A's project or sandbox.
4. Start builds from both accounts simultaneously → both run, in separate sandboxes.
5. **Kill a worker mid-run.** The job requeues, the user sees a reconnect, and the run finishes.
6. Idle a project for the timeout → the sandbox is reaped → next message boots a fresh one and
   the project files are still there.

---

## Architecture

```
   Browser ──https/SSE──► API Gateway ──────► Postgres
                              │  auth · validate · fan-out
                              ▼
                        Orchestrator          job state machine
                              │
                              ▼
                            Queue             back-pressure
                              │
                              ▼
                        Sandbox Manager       provision · pool · reap
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌───────────┐   ┌───────────┐   ┌───────────┐
        │ SANDBOX   │   │ SANDBOX   │   │ SANDBOX   │
        │  worker   │   │  worker   │   │  worker   │
        │    │      │   └───────────┘   └───────────┘
        │  agent ───┼──► LLM
        │    │      │
        │  fs/bash/ │
        │  git      │
        │    │      │
        │  dev srv ─┼──► preview-<id>.domain
        └─────┬─────┘
              │ snapshot
              ▼
        Object storage
```

### Job state machine (the Orchestrator's job)

```mermaid
stateDiagram-v2
    [*] --> queued
    queued --> provisioning: worker claims
    provisioning --> running: sandbox ready
    running --> awaiting_approval: tool needs approval
    awaiting_approval --> running: resolved
    running --> verifying: turn complete
    verifying --> running: more tasks
    verifying --> succeeded: all green
    running --> failed: unrecoverable
    provisioning --> queued: provision failed (retry ≤3)
    running --> queued: worker died (requeue)
    queued --> cancelled: user cancels
    running --> cancelled: user cancels
    succeeded --> [*]
    failed --> [*]
    cancelled --> [*]
```

Every transition is persisted. **A worker dying is an ordinary transition, not an exception** —
that is what makes acceptance step 5 pass.

---

## TODO

### Slice 1 — Sandbox abstraction
- [ ] `libs/ts/sandbox`: define the port before picking a provider.
```ts
interface SandboxProvider {
  create(opts: { projectId: string; snapshot?: string }): Promise<Sandbox>;
  destroy(id: string): Promise<void>;
}
interface Sandbox {
  id: string;
  exec(cmd: string, opts?: { timeoutMs?: number }): Promise<ExecResult>;
  writeFile(path: string, content: string): Promise<void>;
  readFile(path: string): Promise<string>;
  snapshot(): Promise<string>;      // → object-storage key
  exposePort(port: number): Promise<string>;   // → public preview URL
}
```
- [ ] **`LocalSandboxProvider`** first — implements the interface with plain child processes on
      your machine. Lets you port every caller to the interface *before* introducing cloud
      latency, cost, and network failure into your debugging loop.
- [ ] **`E2BSandboxProvider`** second — the real one.
- [ ] Swap by config. If swapping requires touching `libs/ts/agent-core`, the port is wrong.

### Slice 2 — Move the agent into the sandbox
- [ ] Decide the split (**recommended:** worker outside, tools execute inside):

| Option | Agent runs | Tools run | Trade-off |
|---|---|---|---|
| A — thin sandbox | on the worker | RPC into the sandbox | Simple; one round-trip per tool call |
| B — fat sandbox | inside the sandbox | inside | Fast; the sandbox needs LLM keys and egress |

  **Take A for V3.** Latency per tool call is tens of milliseconds and irrelevant next to LLM
  latency; keeping API keys out of an environment that runs LLM-authored code is worth far more.
- [ ] Every filesystem/bash tool routes through `Sandbox.exec` / `readFile` / `writeFile`.
- [ ] Git worktrees (V2) now live **inside** the sandbox. Same commands, different host.

### Slice 3 — Queue + Orchestrator
- [ ] Pick a queue. **Recommended: BullMQ on Redis** — you almost certainly need Redis anyway for
      pub/sub and the sandbox registry. (Postgres-backed `pgboss` is a fine alternative that
      avoids a new dependency.)
- [ ] `services/orchestrator` (currently an empty file) owns the job state machine above.
- [ ] `services/agent` (currently an empty file) consumes jobs and drives the agent loop.
- [ ] Job payload is an **id, not a blob** — `{ jobId, sessionId }`. The worker reads state from
      Postgres. Fat payloads go stale the moment anything else writes.
- [ ] Heartbeats: a worker renews a lease every N seconds; a missed lease requeues the job.
- [ ] Idempotency: a requeued job must not duplicate messages. Key writes on
      `(sessionId, seq)` and make the write idempotent.
- [ ] Cancellation: `POST /session/:id/cancel` → flag in Redis → the loop checks it between
      iterations → sandbox torn down.

### Slice 4 — Streaming across process boundaries
- [ ] Worker publishes agent events to Redis pub/sub, channel per session.
- [ ] API subscribes and forwards to connected SSE clients.
- [ ] Worker **also** batches writes into Postgres (durable path) — hot path and durable path
      stay separate.
- [ ] Reconnect still works via `?afterSeq=N` from V1, now reading from Postgres.

```
sandbox ─events─► worker ─┬─pub/sub──► API ──SSE──► browser     (hot, lossy, fast)
                          └─batch────► Postgres                  (durable, ordered)
```

### Slice 5 — Auth & multi-tenancy
- [ ] Real auth. **Recommended:** a hosted provider (Clerk/Auth0/WorkOS) or Lucia if self-hosting.
      Do not hand-roll session management in the version where strangers first arrive.
- [ ] `User` already exists in `libs/ts/db`. Make `Project.userId` **non-null**.
- [ ] **Every** query filters by `userId`. Add a repository layer so the filter cannot be forgotten
      — an ownership check missed in one route is the whole tenancy model gone.
- [ ] Ownership check on: project, session, message, approval, sandbox, preview URL.
- [ ] Preview URLs must be unguessable (a random id, not `preview-1`) and ideally auth-gated.
- [ ] Rate limits per user: requests/min, concurrent sandboxes, tokens/day.

### Slice 6 — Sandbox lifecycle & cost
- [ ] Warm pool: keep K sandboxes pre-booted. Cold start is the single biggest latency cost.
- [ ] Idle reaping: no activity for N minutes → snapshot the filesystem → destroy.
- [ ] Restore: next message → new sandbox from the snapshot.
- [ ] Hard caps per sandbox: CPU, memory, disk, wall-clock. Kill on breach.
- [ ] Egress policy: allow npm/pip/github; deny everything else, especially internal ranges.
- [ ] **No production credentials inside a sandbox, ever.** If it needs a DB, it goes through a
      proxy that holds the real credentials; the sandbox gets a short-lived scoped token.
- [ ] Cost telemetry per project: sandbox-minutes + tokens, rolled onto `Session`/`Project`.

### Slice 7 — Deploy the platform itself
- [ ] Dockerise `services/api`, `services/orchestrator`, `services/agent`.
- [ ] Managed Postgres + Redis.
- [ ] Wildcard DNS + TLS for `*.preview.<domain>`.
- [ ] Health checks, structured logs with `sessionId`/`jobId` on every line, an error tracker.
- [ ] A staging environment. You will need somewhere to break things.

### Slice 8 — Prove it
- [ ] All six acceptance steps, on the deployed environment.
- [ ] Deliberate tenancy probe: as user B, call every route with user A's ids. Every one 404s.
- [ ] Chaos: kill a worker, kill a sandbox, kill Redis. Confirm each degrades rather than corrupts.

---

## Files this version touches

```
NEW  libs/ts/sandbox/src/*             SandboxProvider port + local & E2B adapters
EDIT services/orchestrator/src/index.ts     EMPTY → job state machine
EDIT services/agent/src/index.ts           EMPTY → job consumer + agent driver
EDIT services/api/src/*                  auth middleware, ownership checks, enqueue instead of execute
EDIT libs/ts/agent-core/src/tools/*         tools execute via Sandbox, not node:fs
EDIT libs/ts/db/prisma/schema.prisma   Sandbox, Job; Project.userId non-null
NEW  infra/                             Dockerfiles, compose, deploy config
```

---

## Traps

| Trap | Symptom | Fix |
|---|---|---|
| Ownership check per route | One forgotten route = full cross-tenant read | Repository layer that requires `userId` |
| Fat job payloads | Worker acts on stale state | Pass ids; read from the DB |
| No idempotency | Requeue duplicates half the transcript | Idempotent writes keyed on `(sessionId, seq)` |
| Guessable preview URLs | Strangers browsing user projects | Random ids + auth gate |
| Secrets in the sandbox | LLM-written code exfiltrates your keys | Proxy pattern; scoped short-lived tokens only |
| No wall-clock cap | One runaway loop bills you all weekend | Hard timeout + kill |
| Cold start on every message | 30s before the first token | Warm pool + snapshot restore |
| Cloud provider first | Debugging cloud latency *and* your own bugs at once | Ship `LocalSandboxProvider` first |

---

## Concepts to learn here

Container/microVM isolation · job queues & at-least-once delivery · idempotency · distributed
state machines · multi-tenancy & row-level isolation · pub/sub fan-out · lease/heartbeat
patterns · cost modelling. See [LEARNING.md → V3](../LEARNING.md#v3--distributed-systems--isolation---the-wall).

---

## Definition of done

- [ ] No agent-authored code executes on the API host. Ever.
- [ ] A stranger can sign up and build something without touching your machine.
- [ ] Killing any single worker loses no user-visible work.
- [ ] Cross-tenant probes all fail.
- [ ] Sandbox spend per project is measurable.
