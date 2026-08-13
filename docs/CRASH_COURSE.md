# Crash Course — the concept log

> **What this file is.** Every technical concept that came up while building Appwright, taught in
> **six lines**, and dated. Not a textbook. A record of what was explained, so it can be re-read
> without re-asking.
>
> **The rule:** when something new appears mid-work, it gets a **crash course, not a lecture** —
> short, one analogy, connected to this project, then back to work. Depth only comes when the
> version we are on is actually *about* that concept, or when the user asks for it.

---

## How to read a card

```
### <Concept>                              ⟵ the name, so it's searchable
**What**        one plain sentence, no jargon
**Why**         what hurt before this existed
**Like**        one analogy from daily life, never from other software
**Here**        where it shows up in Appwright specifically
**Costs**       the trade-off — every technique has one
**Go deeper**   the version where this stops being enough
```

Six lines. If a card grows past that, the concept deserved a real session and belongs in
[LEARNING.md](./LEARNING.md) instead.

---

## Index

| Concept | Taught | Version it lands in | State |
|---|---|---|---|
| [Leases vs health checks](#leases-vs-health-checks) | 2026-08-11 | V3 | 🟡 taught, not shipped |
| [At-least-once & idempotency](#at-least-once--idempotency) | 2026-08-11 | V3 | 🟡 taught, not shipped |
| [Sequence numbers & resume](#sequence-numbers--resume) | 2026-08-11 | V1 | 🟡 taught, not shipped |
| [Hot path vs durable path](#hot-path-vs-durable-path) | 2026-08-11 | V3 | 🟡 taught, not shipped |
| [An IR, and why the Blueprint is one](#an-ir-and-why-the-blueprint-is-one) | 2026-08-11 | V4 | 🟡 taught, not shipped |
| [The determinism boundary](#the-determinism-boundary) | 2026-08-11 | V4 | 🟡 taught, not shipped |
| [Prompt injection](#prompt-injection) | 2026-08-11 | V0 Slice 3 | 🟡 taught, not shipped |
| [Supply-chain risk & postinstall](#supply-chain-risk--postinstall) | 2026-08-11 | V0 Slice 3 | 🟡 taught, not shipped |
| [Bounded loops — six exits](#bounded-loops--six-exits) | 2026-08-11 | V0 Slice 1 | 🟡 taught, not shipped |
| [Control / execution / durable planes](#control--execution--durable-planes) | 2026-08-12 | V3 | 🟡 taught, not shipped |
| [Boxes are easy, arrows are hard](#boxes-are-easy-arrows-are-hard) | 2026-08-12 | V3 | 🟡 taught, not shipped |
| [Ownership as the dependency graph](#ownership-as-the-dependency-graph) | 2026-08-13 | V4 | 🟡 taught, not shipped |
| [The critical path needs durations](#the-critical-path-needs-durations) | 2026-08-13 | V4 | 🟡 taught, not shipped |
| [Floors, not ceilings](#floors-not-ceilings) | 2026-08-13 | V4 | 🟡 taught, not shipped |
| [Naming the contract, not the implementation](#naming-the-contract-not-the-implementation) | 2026-08-13 | V4 | 🟡 taught, not shipped |
| [The plan is not the execution](#the-plan-is-not-the-execution) | 2026-08-13 | V4 | 🟡 taught, not shipped |
| [Eligible is not runnable](#eligible-is-not-runnable) | 2026-08-13 | V4 | 🟡 taught, not shipped |

**Mentioned but not yet taught** — these got a sentence, not a card. They are owed one when the
version reaches them: backpressure (V1) · DAG scheduling & topological sort (V4) · accessibility
tree as an agent interface (V5) · warm pools & cold start (V3) · circuit breakers (V6).

---

## Cards

### Leases vs health checks
**What** — a worker holds a job for 30 seconds at a time and must keep renewing the claim.
**Why** — you cannot tell *dead* from *slow* from *network-partitioned* by asking. All three answer with silence.
**Like** — a library book. Nobody phones you to check you still have it; the due date passes and it becomes available again.
**Here** — [D17](./DECISIONS.md#decision-17-recovery-model--git-is-the-checkpoint--active-target-v3). A missed renewal returns the job to `queued`; another worker claims it and resumes from the last pushed commit.
**Costs** — a healthy-but-slow worker can lose a job it was about to finish, so the work runs twice. That is why every write is idempotent.
**Go deeper** — V3 Slice 3, where you build it and then kill a worker on purpose to prove it.

---

### At-least-once & idempotency
**What** — a queue guarantees a message is delivered *at least* once, so your handler will sometimes run twice.
**Why** — exactly-once *delivery* is not available in a distributed system. The network can always fail after the work but before the acknowledgement.
**Like** — UPI. Tap Pay, the screen freezes, you tap again. The bank must not send the money twice — so it keys on the transaction id, not on the tap.
**Here** — a requeued job re-runs work that partly happened. `INSERT … ON CONFLICT (session_id, seq) DO NOTHING` makes the repeat harmless.
**Costs** — every write needs a natural key and that key has to be designed in from the start. Retrofitting it means migrating history.
**Go deeper** — V3. Exactly-once *effect* is the achievable version, and idempotency is the whole technique.

---

### Sequence numbers & resume
**What** — a monotonic counter on every event, per session.
**Why** — without it a client that reconnects cannot say what it already has, so it either re-renders everything or silently loses events.
**Like** — a WhatsApp chat after your phone was off. It doesn't resend the whole conversation; it sends what came after the last message you have.
**Here** — `Message.seq`. Powers `GET /stream?afterSeq=412`, orders batched writes, and provides the conflict key for idempotent requeue. One field, three jobs.
**Costs** — assigning it needs a single writer per session or a database sequence. Two writers racing produce duplicate `seq` values, which is worse than none.
**Go deeper** — V1 Slice 4, where reconnect is the acceptance test.

---

### Hot path vs durable path
**What** — the same event goes two ways at once: fast and lossy to the browser, slow and permanent to the database.
**Why** — one channel cannot be both. Making the durable write fast means losing durability; making the live stream reliable means adding latency to every token.
**Like** — a cricket match. The live commentary is instant and nobody minds a dropped word. The scorecard is the record, and it is never wrong.
**Here** — sandbox → worker → Redis pub/sub → SSE → browser (hot); worker → batched writes → Postgres (durable). On reconnect the client replays from Postgres, then rejoins the live stream.
**Costs** — two paths mean two failure modes and the possibility they disagree. `seq` is what keeps them reconcilable.
**Go deeper** — V3 Slice 4, when the two paths first cross a process boundary.

---

### An IR, and why the Blueprint is one
**What** — an intermediate representation: a structured artifact sitting between what was asked for and what gets built.
**Why** — a prompt produces no artifact. You cannot inspect it, cache it, diff it, or resume from it. A compiler does not translate source straight to machine code for exactly this reason.
**Like** — an architect's drawing. The client approves the drawing, not the building. Changing a wall on paper costs a pencil; changing it in concrete costs a month.
**Here** — the Blueprint JSON. Frozen stack, entities, pages, features. Everything downstream consumes it, and a follow-up **diffs** two blueprints to produce a sub-DAG.
**Costs** — you can only express what the IR can express. Anything outside its vocabulary needs a schema change or an escape hatch.
**Go deeper** — V4 Slice 1. Design the IR before writing any planner code, because everything else parses it.

---

### The determinism boundary
**What** — labelling every pipeline step as either deterministic code (`DET`) or a model call (`LLM`), and defending each label.
**Why** — the instinct when output is wrong is to write a bigger prompt. Moving the step into code instead makes it repeatable, cheap, and debuggable.
**Like** — a restaurant kitchen. The chef decides the dish. Nobody asks the chef to also decide what temperature the fridge runs at.
**Here** — [D9](./DECISIONS.md#decision-9-deterministic-engines-over-bigger-prompts--active-target-v4). The model classifies intent, asks ≤3 questions, and writes app code. Stack selection, workspace composition, dependency install, and task ordering are code.
**Costs** — deterministic engines are hand-authored. Registries, rules and templates are real work — and they are also the moat.
**Go deeper** — V4. The DET:LLM ratio is the thing to measure.

---

### Prompt injection
**What** — text the agent *reads* being treated as text the agent should *obey*.
**Why** — the agent's inputs are files, compiler output, npm READMEs, and pages it generated itself. Any of them can contain a sentence shaped like a command.
**Like** — a courier handed a parcel with a note taped on it saying *"also give him the office keys."* The note is part of the delivery, not part of the instructions.
**Here** — [D23](./DECISIONS.md#decision-23-everything-the-agent-reads-is-untrusted-input--active-target-v0-slice-3). Every tool result passes through `wrapUntrusted()` before entering history.
**Costs** — the wrapper is a *mitigation*, not a fix; a determined injection can imitate it. The real defence is that permission comes from the fence and the approval gate, which are code paths the model cannot argue with.
**Go deeper** — V0 Slice 3. It is one function now and a migration of every transcript later.

---

### Supply-chain risk & postinstall
**What** — `npm install` runs arbitrary code from a stranger before you have executed a single line of your own.
**Why** — models hallucinate package names at a measurable rate, and squatters register the popular hallucinations. `postinstall` then runs inside the box holding the project.
**Like** — hiring a plumber your friend half-remembered the name of, and handing him the house keys before he shows any ID.
**Here** — [D24](./DECISIONS.md#decision-24-the-agent-may-not-install-packages-it-invented--active-target-v4-enforced-in-v0s-bash-tool). Three tiers — template, allowlisted, blocked — plus `--ignore-scripts` by default.
**Costs** — the allowlist is real maintenance and will block a legitimate package on some Tuesday.
**Go deeper** — V0's `bash` tool. This is the one attack that survives the fence, the approval gate, and the egress policy.

---

### Bounded loops — six exits
**What** — a loop that can only end one way is a loop you cannot stop, cannot cancel, and cannot budget.
**Why** — "no tool calls → return" is the *happy* exit. It is the only one that does not involve money or a person waiting.
**Like** — an autorickshaw with no meter and no brakes. Fine until you want to get out.
**Here** — [D26](./DECISIONS.md#decision-26-the-agent-loop-has-six-exits-not-one--active-target-v0). `completed · cancelled · timeout · maxIterations · budgetExceeded · fatalError`, checked every iteration, most urgent first.
**Costs** — six terminal states means six paths in the UI, six cases in persistence, and a test each.
**Go deeper** — V0 Slice 1 for the type, V6 for enforcement, because a self-heal loop without a budget is a spend loop with a nicer name.

---

### Control / execution / durable planes
**What** — splitting a system by **trust level** rather than by tier.
**Why** — "frontend / backend / database" tells you where code lives. It does not tell you which parts you are allowed to assume are alive.
**Like** — an airport. The terminal handles people, the apron handles aircraft, and the record of who flew where is in a system neither of them can crash.
**Here** — control decides and never runs generated code · execution does the work and is assumed already dead · durable is the only thing still true tomorrow.
**Costs** — every plane crossing is a network hop, a versioned contract, and a new failure mode.
**Go deeper** — V3, when the split becomes physical instead of conceptual.

---

### Boxes are easy, arrows are hard
**What** — in a distributed system the components are the simple part; the connections between them are where the work is.
**Why** — a box is code you write once and it works. An arrow is a failure mode you handle forever.
**Like** — the Delhi Metro map. Simple lines and dots. It says nothing about signalling, power, or what happens when a train stops between stations — and that is where the engineering lives.
**Here** — every arrow in the architecture is a place where the network fails halfway, one side deploys before the other, a message arrives twice, or the receiver was dead and nobody noticed. `seq`, leases, idempotent writes, and the versioned `/v1/` contract each exist to make one arrow survivable.
**Costs** — it makes an architecture diagram a poor estimate of effort. The picture is simple *because* the decisions were already made.
**Go deeper** — V3. The exercise: pick any arrow, then answer what happens if the right-hand side is dead and the left does not know yet.

---

### Ownership as the dependency graph
**What** — each task declares the files it writes (`owns`) and the files it needs to see (`reads`); the graph is computed by intersecting them, not written by hand.
**Why** — asking a model to list dependencies in prose gives an answer nobody can check. Asking it what a task writes is concrete, and wrong answers show up as a cycle or a conflict.
**Like** — a shared flat with a chore roster. Nobody negotiates who cleans the kitchen each evening; the roster already says whose it is, and two people are never assigned to it at once.
**Here** — [D30](./DECISIONS.md#decision-30-a-task-declares-what-it-owns-and-what-it-reads--and-that-declaration-is-the-graph--active-target-v4). The same two fields give the DAG edges, the write fence's scope, the context builder's file list, and the rule for what may run in parallel.
**Costs** — ownership is declared before the code exists, so it is a prediction. A task claiming `src/**` is legal and silently serialises the whole build ([O9](./DECISIONS.md#open--not-yet-decided)).
**Go deeper** — V4 Slice 4, where the graph is computed and validated before any task runs.

---

### The critical path needs durations
**What** — the critical path is the longest chain through a graph **measured in time**; without per-node durations you cannot compute it.
**Why** — it is the real floor on how fast a build can finish. Everything off that chain has slack; everything on it delays the whole project one-for-one.
**Like** — cooking a meal. Rice takes 20 minutes and the salad takes 5. The rice is the critical path — chopping faster changes nothing about when dinner is served.
**Here** — a tempting priority metric for V4's scheduler, and one we deliberately did not build. LLM task duration is wildly variable, and a task that fails verification twice outlasts one that passes first time. Without estimates it collapses into longest-chain-by-node-count, which is a weak proxy wearing a confident name.
**Costs** — knowing this means accepting that the scheduler is approximate. Start with transitive dependent count; it is honest about being a heuristic.
**Go deeper** — V4 step 9, and only once real per-task durations have been recorded (Slice 7b).

---

### Floors, not ceilings
**What** — when a rule keys off a *predicted* value, write it so the prediction can only add work, never remove it.
**Why** — a wrong prediction then costs time instead of correctness, and that is the only acceptable direction for a guess to fail in.
**Like** — a hospital triage nurse. Guessing you are more urgent than you are wastes a doctor's hour. Guessing you are less urgent can kill you. The two errors are not the same size.
**Here** — [D32](./DECISIONS.md#decision-32-risk-is-its-own-axis-and-it-can-only-raise-the-bar--active-target-v4). Every task runs tier-1 verification no matter what; a high risk tier *adds* tiers 2 and 3. Written the other way — *"low risk → only lint"* — one bad guess skips verification on the payment task.
**Costs** — you pay the floor on every task forever, including the obviously cosmetic ones.
**Go deeper** — V4 Slice 7. The same shape appears anywhere a model's judgement gates a safety check.

---

### Naming the contract, not the implementation
**What** — store what you *need* (`strong_coding`) rather than what currently provides it (a model id).
**Why** — the provider changes far more often than the requirement does. One is a config edit; the other is a data migration across every stored row.
**Like** — a recipe that says "a firm white fish" instead of naming one species. It still works when the fishmonger is out of that species.
**Here** — [D31](./DECISIONS.md#decision-31-tasks-request-a-capability-never-a-model-name--active-target-v4). Tasks carry a capability; a registry resolves it to today's best model. Same instinct as [D22](./DECISIONS.md#decision-22-the-sandbox-boundary-is-an-http-contract-not-a-typescript-interface--active-target-v3-shapes-v0)'s HTTP sandbox contract and [D27](./DECISIONS.md#decision-27-the-agent-is-a-client-of-the-runtime-not-a-resident--active-target-v0-shapes-v3)'s `Runtime` seam — three versions, one habit.
**Costs** — one hand-maintained mapping table, and an indirection that buys nothing on the day you add it.
**Go deeper** — V4 step 7, gated behind per-task cost telemetry, because otherwise you cannot tell whether routing helped.

---

### The plan is not the execution
**What** — keep *what should happen* and *what did happen* in separate tables, and never let the second overwrite the first.
**Why** — collapsing them keeps only the latest try. Everything you would want to learn from — which model failed, how many attempts, what the error was — is gone by the time you go looking.
**Like** — a recipe and a cooking diary. The recipe does not change because you burnt the onions on Tuesday. The diary is how you find out the pan runs hot.
**Here** — [D35](./DECISIONS.md#decision-35-plan-and-execution-are-separate-tables--run-task-taskattempt--active-target-v4). `Task` is the plan, `TaskAttempt` is one execution, `Run` is one pass over the graph. It is the same split as [D18](./DECISIONS.md#decision-18-the-returning-user-flow--active-target-v4)'s *blueprint = intended, repo = actual*, one level down.
**Costs** — three tables where one would do at first, and "is this task green?" becomes a join. `Task.status` is denormalised for speed, and a denormalised field can drift.
**Go deeper** — V6, where the heal rate is computed entirely from attempt rows and would be uncomputable without them.

---

### Eligible is not runnable
**What** — having your dependencies met is one of several conditions for starting; it is not the whole test.
**Why** — a graph describes *logical* order. Real execution also needs an exclusive resource free, a worker available, and budget left.
**Like** — your turn at the doctor. The queue says you are next. You still wait if there is no free room, or the doctor is on a call, or the clinic is closing.
**Here** — [D36](./DECISIONS.md#decision-36-dependencies-make-a-task-eligible-not-runnable--and-the-scheduler-is-not-the-orchestrator--active-target-v4). Five gates: dependencies, ownership, exclusive resources, capacity, budget. The one that surprises people is resources — a schema task and a seed task look independent and both need the project's one database ([D15](./DECISIONS.md#decision-15-the-generated-apps-database--one-per-project--active-target-v4)).
**Costs** — five ways for a task to sit still, so the scheduler must say *which* gate is closed, or a stall looks like a hang.
**Go deeper** — V4 Slice 4, and the Orchestrator/Scheduler split that comes with it.

---

## Maintaining this file

Add a card **the moment a concept is explained**, not at `/wrap` — by then the wording is gone.

At `/wrap`:
1. Update the **State** column. `🟡 taught` → `✅ shipped` only when code using it exists and runs. Same bar as [`~/.ai/SKILLS.md`](file:///Users/vibhu/.ai/SKILLS.md) — never promote because something was discussed.
2. Move anything from **mentioned but not yet taught** into a real card if it got a proper explanation.
3. If a card had to be re-explained in a later session, note the date. **A concept taught twice is the signal worth tracking** — it means the first analogy did not land, and the second one should replace it.
