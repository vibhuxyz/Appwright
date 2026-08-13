# V1 — Web App + Memory

> **Goal:** drive the agent from a browser, watch it work in real time, and have the whole
> conversation survive a page refresh.
>
> **Status:** 🔴 not started · **Est.** 2–3 weeks · **Depends on:** [V0](./V0_AGENT_LOOP.md)

---

## Why this version exists

A terminal agent is a toy. The moment state lives in a database instead of a process, you get
history, resume, multi-device, and (later) handoff **for free**. This version is where the
product starts existing.

This is the deck's Milestone 1: *invoking an agent from the web UI · project states ·
conversation history per project.*

---

## Acceptance test

1. Open `localhost:3000` (Appwright's own UI — `services/web/vite.config.ts` pins it, `strictPort`).
   See a list of projects. Create one.
2. Type *"add a dark mode toggle to the header"*.
3. Watch tool calls appear **as they execute** — not a spinner, then a dump.
4. **Hard-refresh the page mid-run.** The transcript is still there and the run is still going.
5. The preview pane shows the app with a working dark-mode toggle.
6. Close the tab, come back tomorrow, open the same project → full history.

---

## Architecture

```
┌────────────────────┐
│   services/web         │  project list · session view · chat · file tree · preview iframe
└─────────┬──────────┘
          │  fetch (CRUD)  +  EventSource (stream)
          ▼
┌────────────────────┐        ┌──────────────┐
│   services/api      │───────►│  Postgres    │  projects · sessions · messages
│   Express + SSE    │        └──────────────┘
└─────────┬──────────┘
          │  runAgentLoop({ emit: sseEmit })
          ▼
┌────────────────────┐
│  libs/ts/agent-core    │───────► LLM
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
project creation — *not* on every follow-up message like *"add dark mode"*. Exclude
`node_modules`, any nested `.git`, and lockfiles from the copy.

---

## TODO

### Slice 1 — Database
- [ ] Rewrite `libs/ts/db/prisma/schema.prisma` to the target shape (see
      [ARCHITECTURE.md §11](../ARCHITECTURE.md#11-data-model)):
  - [ ] `Project` — `id, userId?, name, templateId, workspacePath, status, createdAt`
  - [ ] `Session` — `id, projectId, title, model, cost, tokenIn, tokenOut, status, createdAt`
  - [ ] `Message` — `id, sessionId, seq, role, type, content, data(Json), createdAt`
  - [ ] index on `(sessionId, seq)` — every history read is ordered by it
- [ ] Keep the existing `Secret` model; drop `ConversationHistory` (replaced by `Message`).
- [ ] `userId` nullable in V1 (no auth yet), non-null in V3. Add the column **now** so V3 is a
      backfill, not a migration of every row.
- [ ] Run the migration; `libs/ts/db` exports a typed client.

**Decision recorded:** Postgres, not the deck's SQLite —
[DECISIONS.md D5](../DECISIONS.md).

### Slice 2 — CRUD routes
- [ ] `POST /project` — create project, copy template → workspace, return id
- [ ] `GET  /projects` — list
- [ ] `POST /session` — new session in a project
- [ ] `PUT  /session/:id` — change model mid-session
- [ ] `GET  /session/:id` — metadata: model, cost, tokens, status
- [ ] `GET  /conversations/:sessionId` — full history, ordered by `seq`, supports `?afterSeq=N`
- [ ] Validate every body with the Zod schemas in `libs/ts/contracts` — shared with the client.

### Slice 3 — `POST /conversation` (the real one)
- [ ] Accept `{ sessionId, prompt }`.
- [ ] Persist the user message immediately (before calling the LLM — if the process dies, the
      prompt is not lost).
- [ ] Load prior history from the DB into the `messages[]` array. **This is what makes the
      conversation stateful across requests.**
- [ ] Respond with `Content-Type: text/event-stream` and keep the connection open.
- [ ] Call `runAgentLoop` with an `emit` that does two things per event:
  - writes it to the SSE stream (hot path)
  - persists it to `Message` (durable path)
- [ ] Persist **every** turn: assistant text, tool calls, tool results.
- [ ] Roll up `cost`/`tokenIn`/`tokenOut` onto the `Session` at the end of each turn.
- [ ] Handle client disconnect: the run **continues** server-side. It is a background job that
      happens to have a listener, not a request that happens to be slow.

### Slice 4 — Stream reconnect
- [ ] `GET /stream/:sessionId?afterSeq=N` — attach to a running session and replay anything missed.
- [ ] Client stores the last `seq` it saw; on reconnect it asks for everything after it.
- [ ] Keep a small in-memory per-session event buffer so a reconnect within a few seconds doesn't
      need a DB round-trip.

*This slice is what makes the refresh in step 4 of the acceptance test work. It is also 80% of
Track B's handoff, obtained for free.*

### Slice 5 — Web UI
- [ ] Replace the Vite starter in `services/web/src/App.tsx`.
- [ ] Routes: `/` project list → `/p/:projectId` session view.
- [ ] Three-pane layout:
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
- [ ] Chat pane renders each event type distinctly: text streams in, tool calls render as
      collapsible rows with args + result.
- [ ] File tree from `GET /files/:projectId`; highlight files the current run touched.
- [ ] Preview pane iframes the workspace's Vite dev server.
- [ ] Model picker wired to `PUT /session/:id`.
- [ ] Token/cost display in the header — you will want it constantly.

### Slice 6 — Dev-server management
- [ ] On project create: `bun install` in the workspace, start Vite on an allocated port.
- [ ] Track `projectId → port` (in memory for V1; the DB in V3).
- [ ] Health-check before the iframe loads, otherwise the user sees a connection error.
- [ ] Kill the dev server when the project is deleted.

### Slice 7 — Prove it
- [ ] Full acceptance test, including the mid-run refresh.
- [ ] Two browser tabs on the same session → both see the same live stream.
- [ ] Kill the API mid-run → restart → history up to the crash is intact in the DB.

---

## Files this version touches

```
EDIT libs/ts/db/prisma/schema.prisma       Project · Session · Message
EDIT services/api/src/index.ts               from 5 lines to the real API
NEW  services/api/src/routes/*.ts            project · session · conversation · files · stream
NEW  services/api/src/stream/sse.ts          SSE helper + per-session event buffer
NEW  services/api/src/workspace/*.ts         template copy, reset, dev-server manager
EDIT services/web/src/*                         the actual UI
EDIT libs/ts/contracts/src/*               request/response schemas shared with the client
```

---

## Traps

| Trap | Symptom | Fix |
|---|---|---|
| History not loaded from DB | Agent has amnesia every message | Load prior `Message` rows into `messages[]` before calling the loop |
| Persisting only the final answer | Refresh loses tool calls; V2's diff review has no data | Persist every event |
| Streaming tied to the HTTP request | User closes the tab → run dies | Run is a background job; the stream is a listener |
| No `seq` | Cannot resume, cannot order batched writes | Monotonic per-session counter |
| Buffering proxy | SSE arrives all at once at the end | `X-Accel-Buffering: no`, disable compression on the stream route |
| Resetting the workspace every message | *"Add dark mode"* wipes yesterday's work | Reset on **new project** only |
| Copying `node_modules` | Project creation takes 90 seconds | Exclude it; run `bun install` in the copy |

---

## Concepts to learn here

SSE vs WebSockets · event-sourced history · optimistic UI · Prisma migrations · long-lived HTTP
connections · backpressure. See [LEARNING.md → V1](../LEARNING.md#v1--persistence--streaming).

---

## Definition of done

- [ ] Acceptance test passes including the mid-run hard refresh.
- [ ] Every message type is persisted and replayable.
- [ ] The agent loop from V0 is **unchanged** — only its `emit` callback differs. If you had to
      modify `libs/ts/agent-core` to make V1 work, the V0 boundary was drawn wrong; fix it now.
- [ ] Cost and token counts visible in the UI.
