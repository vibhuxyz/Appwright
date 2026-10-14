# Engineering standard

> Adopted 2026-09-30 ([D71](./DECISIONS.md)). Distilled from the user's *Engineering-First Project
> Building Master Prompt*, applied to Appwright. Tool-neutral.
>
> Where this disagrees with a version doc's *scope*, the version doc wins for what to build. Where
> it disagrees on *how to know it's done*, this wins.

---

## Identity

Appwright is an **AI developer execution/runtime laboratory** — not a feature factory.

The product shape (Emergent/Lovable) is the *vehicle*. The point is the hard problem underneath:

> **How do we safely execute unreliable AI-generated plans?**

A feature earns its place when it **enables an engineering experiment**. "Add a settings page" does
not. "Add approvals so I can measure what an unattended `bash` costs in blast radius" does.

Sibling projects (Weave, Exchange, Inference Lab) follow the same standard; this file is only about
Appwright.

---

## The four engineering questions

Every version is answered against these. They are the *why* behind the ladder.

| # | Question | Where it gets answered |
|---|---|---|
| Q1 | How do we **safely execute** unreliable AI-generated plans? | V0 path fence · V2 approvals · V3 sandbox |
| Q2 | How do we **isolate concurrent** code changes? | V2 worktrees · V3 per-project sandbox |
| Q3 | How do we **recover from partial execution**? | V2 rollback · V3 leases/heartbeats · V6 self-heal (D44) |
| Q4 | How do we **verify** generated code actually satisfies the task? | V2 verify tier 1 · V4 plan validation · V5 browser agent |

Each version doc carries an **Engineering question** block naming which of these it moves, and
what it will *measure*.

---

## The loop (replaces "build the feature")

```
Hard problem → constraints → minimal baseline → BENCHMARK → profile → find bottleneck
             → change → benchmark again → break it → recover → trade-offs → write it up
```

This **does not conflict** with the standing rule *"never optimise before feeling the limitation."*
It sharpens it: the limitation must be **measured**, not felt. The baseline is deliberately naive
and deliberately instrumented.

---

## Per-subsystem template

Before a non-trivial subsystem starts, its version doc (or a D-entry) states:

```
Problem            what is hard
Constraints        latency · throughput · ordering · durability · cost · isolation · recovery time
Failure modes      what can go wrong
Invariants         → docs/INVARIANTS.md
Baseline           the simplest imperfect version
Measure            what numbers, from what harness
Break              which failure experiments
Alternatives       ≥2 designs considered, with the reason for the choice
```

"Industry standard" is not a reason. *"I evaluated A/B/C; under this workload B did X, so B"* is.

---

## Write by hand vs. vibe

The master prompt's split, mapped to Appwright:

| Write by hand (own the decision *and* the code) | Hybrid (AI writes, you read and can explain) | Vibe freely |
|---|---|---|
| agent loop and its six exits · budget seat-holds (D45) · `seq` allocation · path fence / `safeResolve` · approval policy · lease/heartbeat/retry logic (V3) · scheduler & dispatch gates (D36) · plan validation (D39) · verification logic · benchmark design · invariant checks | Postgres/Redis/Kafka plumbing · Docker/compose · sandbox-provider adapter (E2B) · OTel wiring · test scaffolding · serialization · provider integrations | UI (`apps/web`) · forms · dashboards · CRUD · boilerplate types · doc formatting |

Rule: **AI can write code. The user owns the engineering decisions.** This is why
`SESSION_PROTOCOL` §1 of `/wrap` ("what I implemented myself") is the honest column — for anything
in the left box, "the tool wrote it" is a debt to be paid back before that version is called done.

---

## Where evidence lives

Created **on first use**, not scaffolded empty (D58's lesson: pre-built structure with nothing
behind it is how this repo drifted).

```
docs/INVARIANTS.md      exists now — what must always be true, and whether anything enforces it
docs/BENCHMARKS.md      first benchmark creates it: harness · baseline · before → after · trade-off
docs/FAILURES.md        first failure experiment creates it: fault injected · detection · recovery time
experiments/NNN-name/   one dir per experiment: README (question · method · result) + the script
```

Benchmarks record p50/p95/p99, throughput, and — for reliability — detection time, recovery time,
duplicate execution, lost work. Load steps 1× → 2× → 5× → 10×. Never write "scalable"; write the
number, or write nothing.

### Optimization entry format

```
Problem:       Evidence (profiler/benchmark):
Hypothesis:    Change:
Before → After:               Trade-off:
```

### Writeup format (one per major experiment)

*I wanted to understand X. The naive version did Y. Benchmark: … Profiling showed Z. I changed
A→B. Before/after. The trade-off was … Next I want to investigate …* — evidence over adjectives.

---

## Definition of done — engineering gate

A version's **acceptance test** (one, no partial credit) still defines "works". Before a version
that touches a Q1–Q4 area is marked **done**, it must additionally answer — in its version doc, in
a line each, or "n/a because …":

Problem · Mechanism · What I implemented myself · Invariants · Benchmark · Bottleneck ·
Optimization · What happens when it breaks · Recovery · Trade-offs · Alternatives ·
What changes at 10×/100× · Can I explain it without naming a framework?

A blank answer is a finding, not a formality. Versions that are pure product surface (V1.1 UI
system, V4.5 visual editor UI) answer only Problem · Mechanism · Trade-offs · Alternatives.

---

## Learn the primitive before the product

When a major technology enters (Kafka, Redis, Postgres locking/MVCC, git worktrees, E2B/Firecracker,
OpenTelemetry, MCP), answer the ten first-principles questions in a CRASH_COURSE card or a D-entry:
problem solved · abstraction · guarantees · cost · internals · failure behaviour · scale behaviour ·
limits · could I build a minimal one · when *not* to use it. Read the primary docs first; do not
copy examples blindly.

Where a hand-built miniature teaches the guarantee (lease manager, retry with bounded backoff,
rate limiter, event log with replay), build the miniature **before** adopting the production
component, then compare. Goal: understand why the production thing exists, not replace it.
