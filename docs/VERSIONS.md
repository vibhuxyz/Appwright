# Devian — Version Ladder

> Target: an **Emergent/Lovable-style AI app builder**. Six versions, each one shippable and
> demoable on its own. Full architecture in [ARCHITECTURE.md](./ARCHITECTURE.md).
> Detailed TODOs per version live in [versions/](./versions/).

---

## The ladder

```
 V0  AGENT LOOP            "the agent can edit a file on my machine"
  │                        while-not-if · tools · streaming · providers
  ▼
 V1  WEB APP + MEMORY      "I can drive it from a browser and my history survives"
  │                        Projects/Sessions/Messages · REST · SSE · 3-pane UI · preview
  ▼
 V2  ISOLATION & CONTROL   "the agent can't wreck anything and I approve what it does"
  │                        git worktrees · approvals · diffs · verification (tsc/build/lint)
  ▼
 V3  CLOUD SANDBOX         "it runs in our cloud, for many users, in parallel"
  │                        queue · orchestrator · sandbox mgr · auth · preview URLs
  ▼
 V4  APP BUILDER           "one prompt → a whole working app"     ◄── EMERGENT PARITY
  │                        planner · blueprint · task DAG · multi-agent generation
  ▼
 V5  AUTONOMY & DEPLOY     "it fixes itself and ships to a real URL"
                           self-heal · memory · observability · one-click deploy
```

---

## At a glance

| V | Name | Ship criterion (the demo) | Est. | Depends on |
|---|---|---|---|---|
| **V0** | Agent Loop | Terminal: *"add a dark mode toggle"* → agent reads, edits, and reports. Multi-step tool chains complete unattended | 1–2 wks | — |
| **V1** | Web App + Memory | Browser: open a project → chat → watch tool calls stream live → refresh the page → history is intact → preview pane shows the running app | 2–3 wks | V0 |
| **V2** | Isolation & Control | Two agent sessions run in parallel on the same repo without collision; a `bash` call pauses for approval; a diff view shows exactly what changed; bad code is caught by `tsc` before it reaches the user | 2 wks | V1 |
| **V3** | Cloud Sandbox | Sign up on a deployed URL from a machine that has never seen the repo → build an app → it runs in **our** sandbox → preview loads from a public URL | 3–4 wks | V2 |
| **V4** | App Builder | *"Build me a food delivery app"* → clarifying questions → visible task list → tasks tick off → working full app in the preview → *"make the cart sticky"* → it updates | 4–6 wks | V3 |
| **V5** | Autonomy & Deploy | Plant a bug → the agent detects it from logs and self-heals → click Deploy → app is live on a real domain | 4+ wks | V4 |

*Estimates assume solo, part-time, learning as you go. They are ranges, not promises.*

---

## What "done" means at each rung

Each version has **one** acceptance test. If it doesn't pass, the version isn't done — no
partial credit, no "mostly working".

### V0 — [details →](./versions/V0_AGENT_LOOP.md)
```
$ devian "read package.json, then add a `clean` script to it"
  ● read_file(package.json)
  ● edit_file(package.json)
  ✓ Added a `clean` script.
```
Two chained tool calls in one turn, no human intervention between them. **That single fact —
the loop continues on its own — is what V0 exists to prove.**

### V1 — [details →](./versions/V1_WEB_APP.md)
Browser at `localhost:5173`: project list → session → chat. Tool calls appear as they execute.
Hard-refresh mid-run and the transcript is still there. Preview iframe shows the edited app.

### V2 — [details →](./versions/V2_ISOLATION_AND_CONTROL.md)
Start two sessions on the same project. Each gets its own worktree/branch. Both run at once.
Neither sees the other's files. A `bash rm -rf` request blocks on an approval prompt. Merge one
session back to `main` from the UI.

### V3 — [details →](./versions/V3_CLOUD_SANDBOX.md)
Deployed. Two different user accounts. Each build boots its own sandbox. User A cannot read
user B's files. Preview at `https://preview-<id>.<domain>`. Kill a worker mid-run → the job
requeues and the user sees a reconnect, not a crash.

### V4 — [details →](./versions/V4_APP_BUILDER.md)
One sentence in → a working multi-page app out, with a visible plan that ticked off task by task,
and every task verified green before the next started.

### V5 — [details →](./versions/V5_AUTONOMY_AND_DEPLOY.md)
The app fixes its own build errors within a retry budget, and deploys to a public URL.

---

## Track B — Local mode (parked)

The deck's **remote control** and **handoff** milestones. Not on the critical path (see
[ARCHITECTURE.md §6.6](./ARCHITECTURE.md#66-why-this-is-deferred-for-us)), but excellent
learning and a real feature later for users whose code cannot leave their machine.

```
 B1  Bridge service           ws from local machine, https from web
 B2  Device auth              CLI browser sign-in (loopback OAuth), device↔account binding
 B3  Handoff                  attach to a live session from any surface, replay by seq
```

Schedule after V4. Nothing in V0–V5 should be designed in a way that makes Track B impossible —
specifically: **all session state stays in the DB, and every event carries a sequence number.**

---

## Sequencing rules

1. **Never skip a rung.** V3 without V2's approvals means an unsupervised agent with a shell.
   V4 without V3 means a planner generating tasks nothing can safely execute.
2. **Each version ends with a demo, not a refactor.** If a version's work doesn't change what
   you can show someone, it belongs inside another version.
3. **Vertical slices inside a version.** Prefer "one route + one UI element + one table, working
   end to end" over "all the routes, then all the UI".
4. **Write the acceptance test first.** It is the definition of done, and it stops scope creep.
5. **Defer every optimisation until you have felt the limitation.** No queue until one process
   is visibly the bottleneck. No warm pool until cold starts visibly hurt. No knowledge graph
   until a flat JSON pack has actually failed to answer a question.

---

## How this relates to the existing `ROADMAP.md`

The root `docs/versions/V4_APP_BUILDER.md` holds the older M1–M5 / P2–P11 board plus a detailed
frontend-registry design. Mapping:

| Old | New |
|---|---|
| M1 create from scratch, M3 realtime, M4 preview, M5 end-to-end | **V1** |
| Phase A (two-directory model), Phase B (event stream → WS) | **V1** |
| P4 Verification Engine | **V2** (basic) → **V5** (full) |
| P2 E2B sandbox, P10 fleet/scale-out | **V3** |
| Phase C (blueprint, registry, selector), P8 thinking front-end | **V4** |
| P5 self-healing, P6 observability, P7 memory, P11 deploy | **V5** |
| P3 repo intelligence, P9 quality agents | **V5+** |

`ROADMAP.md` stays as the deep design reference for the frontend-builder/registry thinking.
**`docs/VERSIONS.md` (this file) is the schedule of record.**
