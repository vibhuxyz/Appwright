# V1 — Web App + Memory

> **Goal:** drive the agent from a browser, watch it work in real time, and have the whole
> conversation survive a page refresh.
>
> **Status:** ✅ done 2026-08-16 · **Est.** 2–3 weeks · **Depends on:** [V0](./V0_AGENT_LOOP.md)

---

## Why this version exists

A terminal agent is a toy. The moment state lives in a database instead of a process, you get
history, resume, multi-device, and (later) handoff **for free**. This version is where the
product starts existing.

This is the deck's Milestone 1: _invoking an agent from the web UI · project states ·
conversation history per project._

---

## Acceptance test

1. Open `localhost:3000` (Appwright's own UI — `apps/web/vite.config.ts` pins it, `strictPort`).
   See a list of projects. Create one.
2. Type _"add a dark mode toggle to the header"_.
3. Watch tool calls appear **as they execute** — not a spinner, then a dump.
4. **Hard-refresh the page mid-run.** The transcript is still there and the run is still going.
5. The preview pane shows the app with a working dark-mode toggle.
6. Close the tab, come back tomorrow, open the same project → full history.

---

## Architecture

```
┌────────────────────┐
│   apps/web         │  project list · session view · chat · file tree · preview iframe
└─────────┬──────────┘
          │  fetch (CRUD)  +  EventSource (stream)
          ▼
┌────────────────────┐        ┌──────────────┐
│   apps/api      │───────►│  Postgres    │  projects · sessions · messages
│   Express + SSE    │        └──────────────┘
└─────────┬──────────┘
          │  runAgentLoop({ emit: sseEmit })
          ▼
┌────────────────────┐
│  packages/agent-core    │───────► LLM
└─────────┬──────────┘
          ▼
   working copy on disk   ──► Vite dev server :5173+  ──► preview iframe
```

**V1 still runs the agent inside the API process.** That is knowingly wrong for production and
correct for now — the queue and worker arrive in V3, when you have actually felt the limitation.

### The two-directory model

```
templates/vite-react/     PRISTINE. read-only. the agent never touches it.
              │
              │  cp -r  (on new project only)
              ▼
   .workspaces/<projectId>/         the agent's working copy. Vite serves this.
```

Reset = `rm -rf .workspaces/<id> && cp -r template .workspaces/<id>`, triggered **only** on new
project creation — _not_ on every follow-up message like _"add dark mode"_. Exclude
`node_modules`, any nested `.git`, and lockfiles from the copy.

---

## TODO

### Slice 1 — Database

- [x] Rewrite `packages/db/prisma/schema.prisma` to the target shape (see
      [ARCHITECTURE.md §11](../ARCHITECTURE.md#11-data-model)):
  - [x] `Project` — `id, userId?, name, templateId, workspacePath, status, createdAt`
  - [x] `Session` — `id, projectId, title, model, cost, tokenIn, tokenOut, status, createdAt`
  - [x] `Message` — `id, sessionId, seq, role, type, content, data(Json), createdAt`
  - [x] index on `(sessionId, seq)` — every history read is ordered by it
- [x] Keep the existing `Secret` model; drop `ConversationHistory` (replaced by `Message`).
- [x] `userId` nullable in V1 (no auth yet), non-null in V3. Add the column **now** so V3 is a
      backfill, not a migration of every row.
- [x] Run the migration; `packages/db` exports a typed client.

**Decision recorded:** Postgres, not the deck's SQLite —
[DECISIONS.md D5](../DECISIONS.md).

### Slice 2 — CRUD routes

- [x] `POST /project` — create project, copy template → workspace, return id
- [x] `GET  /projects` — list
- [x] `POST /session` — new session in a project
- [x] `PUT  /session/:id` — change model mid-session
- [x] `GET  /session/:id` — metadata: model, cost, tokens, status
- [x] `GET  /conversations/:sessionId` — full history, ordered by `seq`, supports `?afterSeq=N`
- [x] Validate every body with the Zod schemas in `packages/contracts` — shared with the client.

### Slice 3 — `POST /conversation` (the real one)

- [x] Accept `{ sessionId, prompt }`.
- [x] Persist the user message immediately (before calling the LLM — if the process dies, the
      prompt is not lost).
- [x] Load prior history from the DB into the `messages[]` array. **This is what makes the
      conversation stateful across requests.**
- [x] Respond with `Content-Type: text/event-stream` and keep the connection open.
- [x] Call `runAgentLoop` with an `emit` that does two things per event:
  - writes it to the SSE stream (hot path)
  - persists it to `Message` (durable path)
- [x] Persist **every** turn: assistant text, tool calls, tool results.
- [x] Roll up `cost`/`tokenIn`/`tokenOut` onto the `Session` at the end of each turn.
      **Done 2026-08-22.** The provider now parses the API's `usage` frame and yields a `usage`
      chunk; the loop prices it (`providers/pricing.ts`) and emits a `usage` **event**; the route
      writes it with `increment`, never read-then-write, and pushes an SSE `usage` frame so the
      header moves during the run.
- [x] Handle client disconnect: the run **continues** server-side. It is a background job that
      happens to have a listener, not a request that happens to be slow.

### Slice 4 — Stream reconnect

- [x] `GET /stream/:sessionId?afterSeq=N` — attach to a running session and replay anything missed.
- [x] Client stores the last `seq` it saw; on reconnect it asks for everything after it.
- [x] Keep a small in-memory per-session event buffer so a reconnect within a few seconds doesn't
      need a DB round-trip.

_This slice is what makes the refresh in step 4 of the acceptance test work. It is also 80% of
Track B's handoff, obtained for free._

### Slice 5 — Web UI

- [x] Replace the Vite starter in `apps/web/src/App.tsx`.
- [x] Routes: `/` project list → `/p/:projectId` session view.
- [x] Three-pane layout:

```
┌──────────────┬──────────────────────┬─────────────────┐
│  CHAT        │  FILES / DIFF        │  PREVIEW        │
│              │                      │                 │
│ user msg     │  ▸ src/              │  ┌───────────┐  │
│ ● read_file  │    ▸ components/     │  │  iframe   │  │
│ ● edit_file  │      Header.tsx  ●   │  │  :5174    │  │
│ assistant... │    App.tsx           │  │           │  │
│              │                      │  └───────────┘  │
│ [ prompt ▸ ] │  [ diff view ]       │  [ ⟳ reload ]   │
└──────────────┴──────────────────────┴─────────────────┘
```

- [x] Chat pane renders each event type distinctly: text streams in, tool calls render as
      collapsible rows with args + result.
- [x] File tree from `GET /files/:projectId`; highlight files the current run touched.
- [x] Preview pane iframes the workspace's Vite dev server.
- [x] Model picker wired to `PUT /session/:id`.
- [x] Token/cost display in the header — you will want it constantly.

### Slice 6 — Dev-server management

- [x] On project create: `bun install` in the workspace, start Vite on an allocated port.
- [x] Track `projectId → port` (in memory for V1; the DB in V3).
- [x] Health-check before the iframe loads, otherwise the user sees a connection error.
- [x] Kill the dev server when the project is deleted.

### Slice 7 — Prove it

- [x] Full acceptance test, including the mid-run refresh.
- [x] Two browser tabs on the same session → both see the same live stream.
- [x] Kill the API mid-run → restart → history up to the crash is intact in the DB.

---

## Files this version touches

```
EDIT packages/db/prisma/schema.prisma       Project · Session · Message
EDIT apps/api/src/index.ts               from 5 lines to the real API
NEW  apps/api/src/routes/*.ts            project · session · conversation · files · stream
NEW  apps/api/src/stream/sse.ts          SSE helper + per-session event buffer
NEW  apps/api/src/workspace/*.ts         template copy, reset, dev-server manager
EDIT apps/web/src/*                         the actual UI
EDIT packages/contracts/src/*               request/response schemas shared with the client
```

---

## Traps

| Trap                                                           | Symptom                                                                                                                                                                                                                                             | Fix                                                                                            |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| History not loaded from DB                                     | Agent has amnesia every message                                                                                                                                                                                                                     | Load prior `Message` rows into `messages[]` before calling the loop                            |
| Persisting only the final answer                               | Refresh loses tool calls; V2's diff review has no data                                                                                                                                                                                              | Persist every event                                                                            |
| Streaming tied to the HTTP request                             | User closes the tab → run dies                                                                                                                                                                                                                      | Run is a background job; the stream is a listener                                              |
| No `seq`                                                       | Cannot resume, cannot order batched writes                                                                                                                                                                                                          | Monotonic per-session counter                                                                  |
| Buffering proxy                                                | SSE arrives all at once at the end                                                                                                                                                                                                                  | `X-Accel-Buffering: no`, disable compression on the stream route                               |
| Resetting the workspace every message                          | _"Add dark mode"_ wipes yesterday's work                                                                                                                                                                                                            | Reset on **new project** only                                                                  |
| Copying `node_modules`                                         | Project creation takes 90 seconds                                                                                                                                                                                                                   | Exclude it; run `bun install` in the copy                                                      |
| **A port counter instead of a port probe** ⚠️ _hit 2026-08-22_ | `nextPort++` is module state. It resets to 5174 on every API restart while dev servers from the _previous_ process are still holding those ports — so the preview iframe points at a different project's app, or at a wedged one                    | `allocatePort()` asks the OS whether each port is genuinely free before spawning               |
| **Orphaned dev servers** ⚠️ _hit_                              | Children are reparented, not killed, when the API exits. One survived a restart pegged at **100% CPU for 27 minutes**, squatting :5174 and answering nothing                                                                                        | `stopAllDevServers()` on `SIGINT`/`SIGTERM`/`exit`                                             |
| **A recorded port for a dead process** ⚠️ _hit_                | `servers.get(id)` returns a port whose process exited, so `GET /project/:id` skips restarting and hands the UI a dead URL. Blank preview, no error anywhere                                                                                         | Check `proc.exitCode === null` as well as `killed`, and re-spawn if it died                    |
| **`stdout: "pipe"` with nobody reading** ⚠️ _hit_              | The buffer fills, the child blocks mid-write, and a dev server accepts TCP but never answers — which looks exactly like a blank preview. Same hazard on `bun install`, where `.exited` then never resolves and project creation hangs with no error | `"inherit"` — drained by the OS, and the output is visible in the API log when a preview fails |

> **All four of these compound with `bun run --watch`**, which is what `dev:api` uses: every edit to
> an API source file restarts the process, and before these fixes each restart leaked another
> orphan and reset the counter. The bug is _invisible_ until you edit API code with projects
> running — which is exactly what a working session looks like.

---

## Concepts to learn here

SSE vs WebSockets · event-sourced history · optimistic UI · Prisma migrations · long-lived HTTP
connections · backpressure. See [LEARNING.md → V1](../LEARNING.md#v1--persistence--streaming).

---

## Definition of done

- [x] Acceptance test passes including the mid-run hard refresh.
- [x] Every message type is persisted and replayable.
- [x] The agent loop from V0 is **unchanged** — only its `emit` callback differs. If you had to
      modify `packages/agent-core` to make V1 work, the V0 boundary was drawn wrong; fix it now.
- [x] Cost and token counts visible in the UI. **Gap closed 2026-08-22**, verified live in the
      browser: a Gemini run moved the header from `$0.0000` to `$0.0550 · 41732↑ 281↓` while it ran.
      Two things were wrong and both are worth remembering: - `stream_options: { include_usage: true }` is **required** — without it a streaming response
      carries no counts at all. It was first sent only to OpenAI/Groq/xAI on the assumption that
      Gemini reports usage unasked. Verified against the live API, Gemini does the exact
      opposite: nothing without the flag, and it accepts the flag happily. **Guessing which
      hosts need it is what produced the wrong answer.** It now goes to all four. - OpenAI's usage frame arrives in the chunk _after_ `finish_reason`, and it carries an
      **empty `choices` array**. Yielding usage at the stop site always yielded nothing, and the
      `if (!choice) continue` guard skipped the frame entirely. Usage is parsed before the choice
      check and yielded after the stream ends.

      **`maxCostUsd` is now reachable**, which it was not before — an unpriced model falls back to
          the top price in its family rather than to zero, because a model that costs nothing can never
          trip a budget.
