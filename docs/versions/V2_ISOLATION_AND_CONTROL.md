# V2 — Isolation & Control

> **Goal:** the agent works in its own branch, asks permission before doing anything dangerous,
> shows you exactly what it changed, and cannot hand you code that doesn't compile.
>
> **Status:** 🔴 not started · **Est.** 2 weeks · **Depends on:** [V1](./V1_WEB_APP.md)

---

## Why this version exists

The deck's *"anything left?"* slide: **git worktrees** and **approvals**. Both are trust
infrastructure. Without them you cannot run two agents at once, you cannot let an agent run
`bash` unattended, and you cannot review what it did before accepting it.

Verification (`tsc`/build/lint) joins them here for the same reason: **never trust generated
code.** A green checkmark that lies is worse than no checkmark.

---

## Acceptance test

1. Start **two** sessions on the same project. Both run at the same time. Each edits files;
   neither sees the other's changes. `git branch` shows `agent/session-a`, `agent/session-b`.
2. Ask an agent to run `rm -rf node_modules`. It **stops** and shows an approval prompt with the
   exact command. Approve → it runs and the loop resumes. Deny → it adapts.
3. Open the diff view: a per-file diff of everything the session changed vs `main`.
4. Click **Merge** → the session's branch merges into `main`, the worktree is removed.
5. Force a type error into a generated file. The run shows **red** with the exact `tsc` message
   instead of reporting success.

---

## Architecture

### Sessions become worktrees

```
.workspaces/<projectId>/
├── repo/                      main branch — the integration point
│   └── .git/                  ← shared object store
├── session-a/                 worktree · branch agent/session-a
└── session-b/                 worktree · branch agent/session-b

  git worktree add ../session-a -b agent/session-a main
  … agent works, commits …
  cd repo && git merge agent/session-a
  git worktree remove ../session-a
```

**One Session = one worktree = one branch.** `Session.branch` and `Session.worktreePath`
already exist in the V1 schema for this.

### Approvals suspend the loop

```
  LLM emits tool_call(bash, "rm -rf node_modules")
              │
              ▼
      policy.requiresApproval(tool, args)?
       │                         │
      no                        yes
       │                         │
       ▼                         ▼
   execute            INSERT Approval(status=pending)
       │                         │
       │              emit approval_request ──► SSE ──► UI
       │                         │
       │                    ⏸  loop parks. NOT an in-memory promise —
       │                       the pending state is a DB row.
       │                         │
       │              POST /approval/:id {approve|deny}
       │                         │
       │                 ┌───────┴───────┐
       │                 ▼               ▼
       │             execute        result = "user denied"
       │                 │               │
       └─────────────────┴───────────────┴──► push tool result, resume
```

**Why a DB row and not a promise:** the API can restart, and the person approving may be on a
different device than the one that asked. An in-memory promise breaks both.

### Verification gate

```
   agent finishes a turn
          │
          ▼
   tsc --noEmit ──► build ──► lint ──► (tests)
          │
     ┌────┴────┐
    red       green
     │          │
     │          └──► ✓ report success, allow merge
     │
     └──► structured error ──► shown in UI
                            └─► (V5: fed back for self-healing)
```

---

## TODO

### Slice 1 — Git-backed workspaces
- [ ] On project create: `git init` the workspace, commit the template as the initial commit on `main`.
- [ ] On session create: `git worktree add <path> -b agent/<sessionId> main`.
- [ ] Point the agent's workspace root at the **session's worktree**, not the project root.
      *(`projectFiles.ts` is already per-**project** — `workspaceRoot(projectId)`. V2 widens that key
      from `projectId` to `sessionId`, since a session is now its own directory. Small change,
      because the global-constant problem was already solved.)*
- [ ] Auto-commit after each agent turn (`agent: <first line of prompt>`) so every turn is a
      revertable checkpoint.
- [ ] `DELETE /session/:id` → `git worktree remove` + branch cleanup.
- [ ] Handle the ugly cases: dirty worktree on remove, branch name collisions, orphaned worktrees
      after a crash (`git worktree prune` on boot).

### Slice 2 — Diff & merge
- [ ] `GET /session/:id/diff` → `git diff main...agent/<id>` parsed into per-file hunks.
- [ ] Diff pane in the UI (reuse the file pane; add an "unstaged/changed" filter).
- [ ] `POST /session/:id/merge` → merge into `main`, return conflicts if any.
- [ ] Conflict handling: **do not** attempt an auto-resolve in V2. Surface the conflict, let the
      user pick a side. Auto-resolution is a V5 problem.
- [ ] `POST /session/:id/revert` → reset the worktree to the last checkpoint commit.

### Slice 3 — Approvals
- [ ] `Approval` table: `id, sessionId, messageId, toolName, args(Json), status, createdAt, resolvedAt`.
- [ ] Permission policy module:
  - `read_file`, `list_files`, `grep` → never ask
  - `write_file`, `edit_file` → ask in `default` mode, auto in `accept-edits`
  - `bash` → always ask unless `bypass`
  - `git push`, network writes → always ask, no bypass
- [ ] Session-level permission mode: `default` | `accept-edits` | `bypass` | `plan` (read-only).
- [ ] Loop suspension: when a tool needs approval, persist, emit, and **await** resolution
      (poll the row or use Postgres `LISTEN/NOTIFY`).
- [ ] `POST /approval/:id` — approve/deny, resumes the parked loop.
- [ ] UI: an inline approval card in the chat stream — tool name, full args, Approve / Deny /
      "Always allow this tool in this session".
- [ ] Timeout policy: park indefinitely, but mark the session `awaiting-approval` so the UI can
      show it in the project list. *(Decide: does a 24h-old approval expire? — open question.)*

### Slice 4 — Verification
- [ ] `libs/ts/verify`: run a command in the workspace, capture structured output.
- [ ] Checks: `tsc --noEmit` → `bun run build` → `lint`. Each returns `{ ok, errors[] }` with
      file/line/message parsed out — not a raw log dump.
- [ ] Run after each agent turn; emit `verification_start` / `verification_result` events.
- [ ] UI: a red/green status bar per turn, expandable to the error list, each error clickable to
      the file:line.
- [ ] Store the result on the `Message` row so history shows which turns were green.

### Slice 5 — Parallel sessions
- [ ] Allow N concurrent runs per project (each in its own worktree).
- [ ] Per-project run limit to stop a user starting 20 at once.
- [ ] Preview: which session does the iframe show? **Decision: one dev server per session**, on
      its own port, so each session previews its own branch. Record the port on `Session`.
- [ ] UI: a session switcher; show which sessions are running / awaiting approval / done.

### Slice 6 — Prove it
- [ ] All five acceptance steps.
- [ ] Kill the API while an approval is pending → restart → the approval is still pending and
      resolvable. *(This is the test that proves approvals aren't in-memory.)*
- [ ] Two sessions edit the **same file** → merge one → merge the second → conflict is surfaced
      cleanly rather than silently clobbering.

---

## Files this version touches

```
NEW  libs/ts/tools/src/*                  worktree add/remove/diff/merge wrappers
NEW  libs/ts/verify/src/*               tsc · build · lint runners + output parsers
EDIT libs/ts/db/prisma/schema.prisma    Approval; Session.branch, worktreePath, mode, devPort
EDIT libs/ts/agent-core/src/loop.ts          approval suspension hook (the ONLY loop change in V2)
NEW  services/api/src/routes/approval.ts
NEW  services/api/src/routes/git.ts       diff · merge · revert
EDIT services/web/src/*                      diff pane · approval cards · verification bar · session switcher
EDIT libs/ts/contracts/src/*            Approval + verification schemas
```

---

## Traps

| Trap | Symptom | Fix |
|---|---|---|
| Approval state in memory | Restart loses a pending approval; can't approve from another device | It's a DB row |
| `projectRoot` still global | Two sessions write to the same directory | Per-session context object |
| Worktrees not pruned | Disk fills with dead directories; branch name collisions | `git worktree prune` on boot + cleanup on session delete |
| Auto-commit swallowing secrets | `.env` committed into the branch | Respect `.gitignore`; never `git add -A` blindly |
| Verification too slow | Every turn waits 40s for a full build | `tsc --noEmit` first (fast, catches most); full build only before merge |
| Bypass mode outside a sandbox | An LLM `rm -rf` on your actual machine | `bypass` is only legal in V3 sandboxes — gate it |
| Merge auto-resolve | Silent data loss | Surface conflicts, never guess |

---

## Concepts to learn here

Git internals (worktrees, refs, the object store, three-way merge) · suspendable/resumable
workflows · capability-based permission models · structured compiler output parsing.
See [LEARNING.md → V2](../LEARNING.md#v2--isolation-trust-and-git).

---

## Definition of done

- [ ] Two agents run in parallel on one repo with zero interference.
- [ ] No destructive tool executes without an explicit, persisted approval (except in `bypass`,
      which is gated off until V3).
- [ ] Every turn has a verification verdict attached.
- [ ] Merging a session back to `main` works from the UI, conflicts included.
