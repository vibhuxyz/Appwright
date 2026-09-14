# Interview prep — Appwright

> **The point of this file.** Appwright touches almost every system-design topic a Senior/Staff
> interview asks about — streaming, queues, isolation, multi-tenancy, idempotency, state machines,
> cost. That's not an accident; it's why it's a good project to learn on.
>
> **Rule: only answer from what you have actually built.** An interviewer can tell the difference
> between "I read about idempotency" and "I hit duplicate messages when a worker died mid-run, and
> here's what I did." Work through this file **version by version, as you finish each one** — not
> all at once at the end.

---

## How to use it

After finishing each version, sit with the questions for that version and answer **out loud**,
without notes. Then read the "what a strong answer sounds like" section and see what you missed.

Ask Claude to run **Milestone Review Mode** on you — it will ask these progressively harder and
push back on weak answers, which is closer to the real thing than reading.

Two habits that matter more than any single answer:

1. **Always state the trade-off.** "I chose X. It costs me Y. I'd switch to Z when W happens."
   That one sentence is the difference between a mid-level and a senior answer.
2. **Always give the failure mode.** Anyone can describe a happy path. Seniors are hired to know
   what breaks.

---

## The one-minute project pitch

Practise this until it's smooth. It's the first question in every interview.

> "Appwright is an AI app builder — you describe an app in one sentence and it generates, verifies,
> and deploys a working one. A planner turns the prompt into a frozen architecture and a task DAG.
> A coding agent executes the tasks inside an isolated cloud sandbox, streaming every tool call to
> the browser over SSE. Each session is its own git worktree, so many agents can work on one repo
> without collision, and every change is reviewable as a diff before it merges.
>
> The interesting engineering isn't the LLM part. It's that an agent run is a long-lived,
> failure-prone, side-effecting job — so it needs a queue, a state machine, idempotent writes,
> isolation from the host, and a durable event log the client can resume from."

Then stop. Let them pick the thread they want to pull.

---

## V0 — The agent loop

_Topics: streaming · protocol design · context budgets · error handling as data_

1. Walk me through the agent loop. Where exactly does it terminate?
2. The naive version handles one tool call and stops. Why is that wrong, and what does the fix
   cost you?
3. The model's response gets cut off by the token limit, mid-tool-call. The arguments still parse
   as valid JSON. What do you do, and why?
4. Which tool calls can you run in parallel, and which absolutely cannot? How does your code know?
5. A tool raises an exception. Walk me through what happens next. Now — why is that better than
   letting it propagate?
6. Your agent read the same file 40 times and burned $12. What went wrong, and what are the two
   defences?
7. How do you keep a 4 MB file from destroying your context window? Where does that logic live?
8. How do you unit-test a loop that calls an LLM, without calling an LLM?

**What a strong answer sounds like (Q5):**

> "A tool error is _data_, not an exception. If it propagates, the whole run dies on a typo'd path.
> Instead I catch it and push it back as the tool result, so the model reads 'file not found' and
> tries a different path. That's most of what makes an agent feel robust. The cost is that a real
> bug in my tool code now looks like a normal tool failure and gets retried — so programmer errors
> still raise, and only expected failures become `Err`."

**Follow-up they'll ask:** _"How do you tell those two apart?"_ — typed errors. `FileError`,
`ExecError` return; a `TypeError` in my own code raises.

---

## V1 — Persistence and streaming

_Topics: SSE vs WebSockets · event sourcing · resumability · long-lived connections_

1. SSE or WebSockets for streaming agent output? Defend the choice.
2. The user hard-refreshes mid-run. What happens to the run? What happens to their transcript?
3. Why does every event carry a monotonic sequence number? What breaks without it?
4. You persist the message _and_ stream it. Which happens first, and why does the order matter?
5. Your agent run takes five minutes. Why can't that live inside the HTTP request handler?
6. Two browser tabs open the same session. What does each one see?
7. The LLM streams tokens faster than the browser renders. What happens? (**backpressure** — say
   the word.)
8. Why store tool calls and tool results as rows, not just the final answer?

**What a strong answer sounds like (Q1):**

> "SSE. The stream is one-directional — server to client — and SSE gives me automatic reconnect
> plus a `Last-Event-ID` header, which is exactly the resume semantics I need. WebSockets would
> mean building reconnection myself for a bidirectional channel I don't use. I'd switch if the
> client needed to send high-frequency messages mid-stream. The one gotcha is buffering proxies —
> SSE arrives all at once at the end unless you disable compression and set
> `X-Accel-Buffering: no`."

**Trap in Q4:** persist the user message _before_ calling the LLM. If the process dies, the prompt
isn't lost.

---

## V2 — Isolation and control

_Topics: git internals · suspendable workflows · concurrency · permission models_

1. What does `git worktree add` actually do? How is it different from `git checkout -b`?
2. Why does one session equal one worktree equal one branch? What would break if sessions shared a
   directory?
3. An approval is pending and the API restarts. What happens? Why isn't the pending state a promise
   in memory?
4. I approve a tool call from my phone, but I started the session on my laptop. How does that work?
5. Two agents edit the same file in parallel worktrees. Walk me through the merge.
6. Why don't you auto-resolve merge conflicts?
7. Which tools need approval and which don't? What's the principle, not the list?
8. Your verification says green but the code doesn't compile. What went wrong?
9. What's the disaster scenario for `bypass` permission mode?

**What a strong answer sounds like (Q3):**

> "The approval is a row in Postgres with status `pending`, not an in-memory promise. Two reasons.
> The API can restart — an in-memory promise dies with the process and the run is stuck forever.
> And the answer may arrive at a _different process_ than the question: I approve from my phone,
> which hits a different API instance than the one holding the promise. Making it durable state
> also gives me the UI a free 'awaiting approval' filter in the project list."

---

## V3 — Cloud sandbox ◄ where most of the hard questions live

_Topics: isolation · queues · idempotency · distributed state · multi-tenancy · cost_

1. Why can't the agent run on the API server? Give me the security answer _and_ the availability
   answer.
2. A worker dies mid-run. Walk me through what happens, step by step.
3. Your queue is at-least-once. What does that mean for your database writes? (**idempotency** —
   they're fishing for it.)
4. How do you know a worker died, rather than being slow? (**leases and heartbeats.**)
5. Why is the job payload just an ID instead of the full session state?
6. User A must never see user B's project. Where do you enforce that, and why not per-route?
7. Cold-starting a sandbox takes 30 seconds. The user is waiting. What do you do?
8. The agent needs to install npm packages but must not reach your internal network. How?
9. Where do the database credentials for a generated app live? Why not in the sandbox?
10. A runaway loop runs all weekend. What stops it? Name three separate limits.
11. Your event stream goes sandbox → worker → API → browser. Why two channels instead of one?
12. Price a single build for me. What are the cost drivers?

**What a strong answer sounds like (Q3):**

> "At-least-once means my handler _will_ run twice — that's not an edge case, it's the contract. So
> every write has to be safe to repeat. I key message inserts on `(session_id, seq)` with a unique
> constraint and use an upsert, so a replayed job writes the same row instead of duplicating half
> the transcript. Exactly-once delivery isn't on offer in a distributed system; exactly-once
> _effect_ is, and idempotency is how you get it. The cost is that every write needs a natural key
> — which is also why `seq` had to exist from V1."

**What a strong answer sounds like (Q6):**

> "A repository layer that _requires_ a `userId` — not a check per route. Per-route checks are
> where tenancy dies: you add a nineteenth endpoint on a Friday and forget one, and now anyone can
> read anyone's projects. Structural enforcement means the unsafe version doesn't compile. I also
> test it adversarially — as user B, call every route with user A's IDs and assert every one 404s.
> Row-level security in Postgres is the stronger version if I wanted defence in depth."

---

## V4 — The planner

_Topics: IR design · DAG scheduling · determinism · prompt architecture_

1. Why a planner? Why not one bigger prompt?
2. What is the Blueprint, and why is it a separate artifact instead of just being in the prompt?
3. How do you decide which pipeline steps are code and which are LLM calls?
4. Task 6 depends on tasks 2 and 5. How do you schedule that? What runs in parallel?
5. A task fails after three retries. What happens to the tasks that depend on it? To the ones that
   don't?
6. The worker dies at task 5 of 8. What happens on resume?
7. "Make the cart sticky" — why doesn't that re-run the whole DAG?
8. Task 7 rewrote the schema task 2 created. How do you prevent that?
9. Same prompt, three runs, three different architectures. Is that a bug?

**What a strong answer sounds like (Q1):**

> "A prompt produces no artifact. A planner produces a Blueprint — JSON I can inspect _before_ any
> code exists, cache, diff between runs, and resume from. Three concrete wins: I can show the user
> a task list ticking off instead of a three-minute spinner; a failure kills one task instead of
> the run; and when the output is wrong I can tell whether it was a _planning_ failure or a
> _generation_ failure, which you simply cannot do with one big prompt. The cost is that the
> deterministic parts are hand-authored content — that's real work, and it's also the moat."

**Q9 is a trick.** The right answer: _"If the stack varies between runs, that's a bug — the
architecture decision engine is deterministic and frozen. If the page copy varies, that's fine.
Diffing three blueprints from the same prompt is actually how I find which steps still belong on
the deterministic side of the line."_

---

## V5 — Autonomy and operations

_Topics: diagnostics · bounded retry · deployment · secrets · evaluation_

1. Self-healing without a budget is what? (An infinite spend loop.)
2. How do you detect the agent is looping instead of making progress?
3. Why classify errors before fixing them? Why not just hand the model the log?
4. Most of your classification is regex, not an LLM call. Why?
5. Seven of eight tasks pass, one is blocked. What do you tell the user?
6. How do you know your self-healing actually works? (**Measure it** — heal rate per error class.)
7. Where do secrets live? Trace one from storage to the deployed app.
8. Why smoke-test a deployment before returning the URL?

**What a strong answer sounds like (Q6):**

> "I have a fixture set of ~20 planted errors across classes — type, dependency, runtime, config —
> and I run the healer over all of them after every change. The number is heal rate per class. It
> matters because self-healing _feels_ impressive and silently does nothing when it's misbuilt.
> Without a number I'd be shipping vibes. It's the same reason evals exist for the planner."

---

## Cross-cutting — the ones they always ask

1. **"Walk me through what happens when a user clicks Build."** — Practise this end to end,
   out loud, in under two minutes. Every layer, in order.
2. **"What was the hardest bug?"** — Have one real story ready with a diagnosis, not just a symptom.
3. **"What would you do differently?"** — Have a genuine answer. "Nothing" is a bad answer.
4. **"Where does this break at 100× the load?"** — Know your actual bottleneck. For Appwright it's
   sandbox capacity, not the API.
5. **"Walk me through a decision you reversed."** — This is your strongest answer, because it is
   real. You chose Python for the agent, built the scaffolding, then reversed it within a day.
   The reasoning is what sells it: the justification was _"V5's eval work is easier in Python"_ —
   a benefit months away, paid for immediately in codegen, two toolchains, and a network hop. Then
   the V5 advantage turned out to be false; the eval library already existed in TypeScript.
   ([D1](./DECISIONS.md) → [D4](./DECISIONS.md).)
   **The line to land:** _"I was optimising for a limitation I hadn't felt yet."_ Interviewers are
   testing whether you can change your mind on evidence and articulate the cost of being wrong.
6. **"Why not SQLite? / Why not LangChain?"** — Both are in [DECISIONS.md](./DECISIONS.md) with
   reasoning. "The reference material said SQLite; I chose Postgres because we're multi-tenant and
   SQLite has one writer" is a strong answer _because_ you're disagreeing with a source, with a
   reason.

---

## The topics Appwright teaches you, mapped

Use this to answer _"what have you learned?"_ concretely.

| Interview topic                  | Where you actually hit it                          |
| -------------------------------- | -------------------------------------------------- |
| Streaming & backpressure         | V1 — SSE, event buffering                          |
| Event sourcing                   | V1 — every turn persisted, replay by `seq`         |
| Idempotency                      | V3 — at-least-once queue, `(session_id, seq)` keys |
| Distributed state machines       | V3 — the job lifecycle                             |
| Leases / failure detection       | V3 — worker heartbeats                             |
| Multi-tenancy                    | V3 — repository-level ownership                    |
| Isolation & sandboxing           | V3 — untrusted code execution                      |
| Queues & back-pressure           | V3 — decoupling request rate from capacity         |
| Pub/sub fan-out                  | V3 — hot path vs durable path                      |
| DAG scheduling                   | V4 — task graph, topological order                 |
| Bounded retry / circuit breaking | V5 — heal budget, loop detection                   |
| Observability                    | V5 — logs, timeline, structured errors             |
| Cost engineering                 | V3 — sandbox-minutes and tokens per build          |
| Concurrency control              | V2 — worktrees, parallel sessions                  |
| Secret management                | V3/V5 — never in LLM context, never in the sandbox |

**Not covered by this project** — be honest if asked: Kafka internals, consensus (Raft/Paxos),
sharding, read replicas, service mesh, Kubernetes at scale, multi-region. Those come after V5, or
from another project. Saying _"I haven't built that, here's what I understand about it"_ is a
better answer than bluffing — and interviewers test for bluffing.

---

_See also:_ [ARCHITECTURE.md](./ARCHITECTURE.md) · [DECISIONS.md](./DECISIONS.md) ·
[LEARNING.md](./LEARNING.md) · [CODE_QUALITY.md](./CODE_QUALITY.md)
