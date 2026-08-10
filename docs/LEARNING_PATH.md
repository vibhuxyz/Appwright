# Learning Path — the curve behind the versions

> Each version of [VERSIONS.md](./VERSIONS.md) demands a specific set of concepts. This file maps
> them: **what to learn, why that version forces it, and how you know you actually know it.**
>
> Rule: learn a concept **when the version needs it**, not in advance. Concepts learned without a
> problem attached don't stick, and half of what you'd pre-learn turns out to be unnecessary.
> Track what you've actually mastered in [LEARNING_LOG.md](./LEARNING_LOG.md).

---

## The curve

```
 difficulty
     ▲
     │                                                    ╭──── V5 autonomy
     │                                          ╭─────────╯     evals · ops · deploy
     │                                 ╭────────╯  V4 planning
     │                                 │           IR · DAG · determinism
     │                    ╭────────────╯  V3 distributed  ◄── THE HARD ONE
     │           ╭────────╯               isolation · queues · tenancy
     │      ╭────╯  V2 git + trust
     │   ╭──╯  V1 persistence + streaming
     │ ╭─╯  V0 the loop
     └─┴───────────────────────────────────────────────────────► time
```

**V3 is the wall.** V0–V2 are application programming — hard, but familiar. V3 is distributed
systems: partial failure, idempotency, isolation, multi-tenancy. Budget extra time and expect the
first design to be wrong.

---

## V0 — The Loop

*Version:* [V0_AGENT_LOOP.md](./versions/V0_AGENT_LOOP.md)

| Concept | Why V0 forces it | You know it when… |
|---|---|---|
| **Function calling / tool use** | The LLM cannot touch a file; it can only ask. The whole agent is that request/response protocol | You can explain what the model actually returns for a tool call, byte for byte, and why `toolCallId` matters |
| **The agentic loop** | The deck's central bug: `if` vs `while`. Everything else is scaffolding | You can state the loop's exit condition without looking |
| **Streaming (SSE, async iterables)** | Tokens must appear as generated, not after 40s | You can consume an async iterable and re-emit it without buffering the whole thing |
| **Provider abstraction** | OpenAI/Anthropic/Gemini disagree on tool-call shape | You can add a third provider by writing only an adapter |
| **Zod → JSON Schema** | Tool definitions must be typed in TS *and* described to the model | One schema, both uses, no drift |
| **Context-window management** | A 4 MB file in a tool result kills the run | You truncate every tool result on the way into history, by default |

**Deliberate exercise:** before writing anything, read `ref-ai/packages/agent/src/agent-loop.ts` end to
end and write, in your own words, (a) where the loop exits, (b) how truncation is detected,
(c) why some tool calls run in parallel and others don't. If you can't answer all three, read it
again — you're about to reimplement it.

**The trap at this level:** treating the loop as glue code. It is the product's core algorithm.
Everything above V0 assumes it is correct.

---

## V1 — Persistence & Streaming

*Version:* [V1_WEB_APP.md](./versions/V1_WEB_APP.md)

| Concept | Why V1 forces it | You know it when… |
|---|---|---|
| **Event-sourced history** | The transcript *is* the state. Persist every turn or you cannot resume | You can rebuild a session's exact context from DB rows alone |
| **SSE vs WebSockets** | You must choose, with a reason | You can say why SSE fits server→client streaming and when WS becomes necessary |
| **Long-lived HTTP** | A 5-minute request breaks every assumption in a normal API | You know why the run must outlive the connection |
| **Sequence numbers & resume** | "Give me everything after event 412" | You can reconnect mid-run and lose nothing |
| **Prisma migrations** | The schema will change many times | You can migrate without dropping data |
| **Backpressure** | The LLM emits faster than the browser renders | You know what happens when a client stops reading an SSE stream |

**Deliberate exercise:** refresh the browser mid-run. If the transcript survives and the run
continues, you understand this level. If it doesn't, you've built state in a process, not a system.

**The trap at this level:** coupling the run to the HTTP request. It's the default shape of an
Express handler and it's wrong here — a request is a *listener* on a job, not the job itself.

---

## V2 — Isolation, Trust, and Git

*Version:* [V2_ISOLATION_AND_CONTROL.md](./versions/V2_ISOLATION_AND_CONTROL.md)

| Concept | Why V2 forces it | You know it when… |
|---|---|---|
| **Git internals: worktrees, refs, objects** | One session = one worktree = one branch | You can explain why a worktree shares `.git` but not the working directory |
| **Three-way merge & conflicts** | Two agents will touch the same file | You can reason about a conflict without reaching for a GUI |
| **Suspendable workflows** | An approval parks the loop for minutes or hours | Your pending state survives a process restart |
| **Capability-based permissions** | Which tools need consent, and who grants it | You can articulate why `bash` is categorically different from `read_file` |
| **Structured compiler output** | `tsc` output must become clickable errors, not a log blob | You parse to `{file, line, message}` rather than showing raw text |

**Deliberate exercise:** run `git worktree add`, make a commit in it, then `git log` from the main
directory. Explain exactly what is shared and what isn't. That mental model is the whole slice.

**The trap at this level:** implementing approvals as an in-memory `Promise`. It works on your
laptop and dies in production, because the answer arrives at a different process than the question.

---

## V3 — Distributed Systems & Isolation  ◄ the wall

*Version:* [V3_CLOUD_SANDBOX.md](./versions/V3_CLOUD_SANDBOX.md)

| Concept | Why V3 forces it | You know it when… |
|---|---|---|
| **Container / microVM isolation** | LLM-authored `bash` is arbitrary code execution | You can name what a container does *not* isolate by default |
| **Job queues, at-least-once delivery** | Work must outlive the request and survive worker death | You know why "exactly once" isn't on offer, and what to do instead |
| **Idempotency** | At-least-once means your handler *will* run twice | You can make a write safe to repeat, on purpose |
| **Distributed state machines** | queued→provisioning→running→… across processes | Every transition is a persisted row, not a variable |
| **Leases & heartbeats** | How do you know a worker died? | You can detect and requeue a dead worker's job |
| **Multi-tenancy** | User B must not reach user A's anything | You enforce ownership structurally, not with a check per route |
| **Pub/sub fan-out** | Events cross a process boundary before reaching the browser | You can explain hot path vs durable path |
| **Cost modelling** | Sandbox-minutes and tokens are real money | You can price a single build |

**Deliberate exercise:** kill a worker mid-run, on purpose, repeatedly. Then kill Redis. Then kill
the sandbox. Each one should degrade, not corrupt. Chaos is not a nice-to-have here — it's the
only way to find out whether your state machine is real.

**The trap at this level:** assuming the happy path. In V0–V2 a crash means "try again". In V3 a
crash means "half the work happened, somewhere, and something else must now reconcile it".

**Also learn here:** how to read a cloud bill. The first month of leaving sandboxes running will
teach it either way — better on purpose.

---

## V4 — Planning Systems

*Version:* [V4_APP_BUILDER.md](./versions/V4_APP_BUILDER.md)

| Concept | Why V4 forces it | You know it when… |
|---|---|---|
| **Planner/executor separation** | The plan must be inspectable before code exists | You can point at the exact boundary in your code |
| **IR (intermediate representation) design** | The Blueprint is a compiler IR by another name | You can add a consumer without changing the producer |
| **DAG scheduling & topological sort** | Tasks have dependencies; some run in parallel | You can compute the parallelisable levels and resume from a partial run |
| **Structured LLM output** | "Return JSON" in prose is not a contract | You use tool-calling/structured output and validate with Zod |
| **Prompt scoping & context budgets** | Whole-repo context per task is slow, expensive, and worse | You can state each task's context budget in tokens |
| **Determinism boundaries** | Which steps are code, which are model calls | You can label every pipeline step DET or LLM, and defend each |

**Deliberate exercise:** take the same prompt three times. Diff the three blueprints. Anything
that varies and *shouldn't* is a step that belongs on the DET side of the line. That diff is the
most useful signal in the whole version.

**The trap at this level:** believing a bigger prompt can replace a planner. It cannot — not
because the model is weak, but because a prompt produces no *artifact*. No artifact means nothing
to inspect, cache, diff, resume, or debug.

---

## V5 — Autonomy and Operations

*Version:* [V5_AUTONOMY_AND_DEPLOY.md](./versions/V5_AUTONOMY_AND_DEPLOY.md)

| Concept | Why V5 forces it | You know it when… |
|---|---|---|
| **Error taxonomy & diagnostics** | You cannot fix what you haven't classified | Most errors are classified by regex, not by an LLM call |
| **Bounded retry / circuit breakers** | Self-healing without a budget is an infinite spend loop | You can state your budget and your loop-detection rule |
| **Deployment pipelines & migrations** | Preview ≠ production | You can deploy, smoke-test, and roll back |
| **Secret management** | Credentials must never enter a model prompt or a log | You can trace where every secret lives and who can read it |
| **RAG / retrieval** | Memory only helps if the right thing is retrieved | You measure retrieval quality instead of assuming it |
| **Evaluation** | "It feels better" is not evidence | You have a number: heal rate per error class |

**Deliberate exercise:** build a fixture set of 20 planted errors across classes. Run the healer
over them after every change. That number moving is the only proof the version works.

**The trap at this level:** shipping features you cannot measure. Self-healing and memory both
*feel* impressive and both silently do nothing when misbuilt.

---

## Cross-cutting, all versions

These never belong to one version — they compound.

- **Reading source over reading docs.** `ref-ai/packages` is a working, production-quality agent. Read it — the patterns are extracted in [CODE_QUALITY.md](./CODE_QUALITY.md).
- **Trade-off articulation.** For every decision, write down what you gave up. That's what
  [DECISIONS.md](./DECISIONS.md) is for, and it's the single highest-leverage habit here.
- **Failure-mode-first design.** Ask *"what happens when this dies halfway?"* before writing the
  happy path. From V3 onward this stops being optional.
- **Never optimise before feeling the limitation.** (Already applied once here: Nx → Turborepo,
  [DECISIONS.md D3](./DECISIONS.md).) No queue until one process is visibly the bottleneck. No
  warm pool until cold starts visibly hurt. No knowledge graph until flat JSON actually failed.
- **Delete aggressively.** `apps/opencode` and `apps/agent-engine` are both dead weight now.
  Carrying dead code costs more than rewriting it.

---

## Habits to build (from [LEARNING_LOG.md](./LEARNING_LOG.md))

1. **Think in trade-offs and failure modes before writing code.** Every table in the version docs
   has a "Traps" section — read it *before* the slice, not after the bug.
2. **Write the acceptance test first.** It is the definition of done and the antidote to scope creep.
3. **One demo per version.** If a chunk of work doesn't change what you can show someone, it
   belongs inside another version.

---

## What to read, per level

| Level | Read |
|---|---|
| V0 | `ref-ai/packages/agent/src/agent-loop.ts` · your provider's tool-use docs (the real API reference, not a blog post) |
| V1 | The SSE spec (it's short) · Prisma migrations guide |
| V2 | `man git-worktree` · Pro Git ch. 7 (tools) and ch. 10 (internals) |
| V3 | E2B or Firecracker docs · BullMQ docs · anything credible on idempotency and at-least-once delivery |
| V4 | Compiler front-end architecture (source → IR → codegen — the analogy is exact) · your provider's structured-output docs |
| V5 | Deployment provider APIs · RAG evaluation writeups · SRE-style error-budget thinking |
