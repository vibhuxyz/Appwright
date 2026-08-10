# Learning Log

Tracks growth: concepts genuinely mastered, concepts in progress, and habits being built.
The syllabus lives in [LEARNING_PATH.md](./LEARNING_PATH.md) — this is the record of what has
actually stuck.

**Bar for "mastered":** you can explain it to someone else *and* you have shipped code that
depends on it. Reading about it doesn't count.

---

## Concepts Mastered

*(Move items here from "Currently Learning" once both conditions above are met. Date them.)*

- *Nothing yet — V0 hasn't started.*

---

## Currently Learning

### For V0 — [the loop](./LEARNING_PATH.md#v0--the-loop)
- [ ] **Function calling / tool use** — the exact wire format of a tool call and why `toolCallId` matters
- [ ] **The agentic loop** — `while`, not `if`; where it exits
- [ ] **Streaming** — SSE and async iterables, re-emitting without buffering
- [ ] **Provider abstraction** — one internal `Message` type, adapters per provider
- [ ] **Zod → JSON Schema** — one schema, two consumers, no drift
- [ ] **Context-window management** — truncate every tool result on the way in

### Ongoing
- [ ] Iterative system design
- [ ] Building deterministic boundaries for LLM agents

---

## Concepts Understood (from Sessions 01–02)

Understood in principle, not yet shipped:

- **Event-driven LLM loops (Pi-style)** — agent execution as a state machine that *yields events
  continuously*, instead of waiting for one block of generated text. *(Session 01)*
- **Function calling execution mechanics** — how an LLM's JSON output is intercepted, executed on
  the host, and fed back into the prompt context. *(Session 01)*
- **Sandboxing & state corruption** — why the two-directory model protects the pristine template.
  *Sharpened since:* it protects the **template**, not the **machine** — real isolation needs a
  sandbox ([D2](./DECISIONS.md#decision-2-the-two-directory-sandbox-model--active-v1-superseded-at-v3), [D6](./DECISIONS.md#decision-6-cloud-sandboxes-over-local-execution--active-target-v3)). *(Session 01)*
- **Token truncation** — an LLM response stopping mid-tool-call because of token limits, and why
  you must not try to parse the partial JSON. *(Session 01)*
- **Parallel tool execution** — grouping calls into `Promise.all()` cuts latency but introduces
  race conditions when tools depend on each other. *Resolution adopted:* parallel for read-only
  tools, sequential for writes. *(Session 02)*

---

## Concepts Added from the *Coding Agents + Cloud* deck

- **`if` vs `while`** — the single most important bug in a naive agent: handling one tool call
  and stopping. Real agents chain many; the conversation ends only when the model returns no tool
  calls. ([ARCHITECTURE.md §3.3](./ARCHITECTURE.md#33--the-bug-in-that-code))
- **State belongs in the DB, not the client** — this one property is what later makes history,
  resume, multi-device, and handoff nearly free. ([§4.1](./ARCHITECTURE.md#41-topology))
- **SQLite's real properties** — serverless, zero-config, single-file, self-contained; genuinely
  correct for a local single-user agent, and genuinely wrong for a hosted multi-tenant one.
  *Learning that "the right answer" is scoped to a product shape, not universal.* ([§4.5](./ARCHITECTURE.md#45-which-db))
- **`git worktree` vs `git checkout -b`** — checkout switches **in place** (one directory, one
  branch); worktree creates a **second physical directory** sharing one `.git`. That difference is
  what makes parallel agents possible. ([§5.1](./ARCHITECTURE.md#51-git-worktrees))
- **Session ≈ worktree ≈ branch** — why `Session` is a first-class table, not just a chat thread.
- **Approvals as suspendable loop state** — the pending state must be a DB row, not an in-memory
  promise, because the answer may arrive at a different process than the question. ([§5.2](./ARCHITECTURE.md#52-approvals))
- **NAT traversal and the Bridge** — a local machine has no public address, so it must **dial out**
  and hold a persistent connection. The server never reaches in. ([§6.2](./ARCHITECTURE.md#62-do-we-need-another-service-yes--a-bridge))
- **ws vs HTTPS polling + SSE** — WebSockets are lower latency; polling over port 443 survives
  hostile proxies. A latency-vs-robustness trade-off, not a right answer. ([§6.3](./ARCHITECTURE.md#63-which-protocol))
- **Loopback OAuth for CLI sign-in** — local listener → browser → redirect with a code → exchange
  for a token; `state` prevents CSRF, the token never sits in a URL bar. ([§6.4](./ARCHITECTURE.md#64-auth--the-part-you-cannot-skip))
- **Why cloud sandboxes are non-optional** — LLM-authored `bash` is arbitrary remote code
  execution. Locally that runs as *you*, with your keys. ([§7](./ARCHITECTURE.md#7-layer-3--the-cloud-pivot))
- **Hot path vs durable path** — pub/sub for latency, Postgres for replay. Two channels, on
  purpose. ([§7.5](./ARCHITECTURE.md#75-streaming-through-the-layers))
- **Planner as compiler** — prompt → IR (Blueprint) → task DAG → codegen. A prompt produces no
  artifact; a planner produces one you can inspect, cache, diff, and resume. ([§8](./ARCHITECTURE.md#8-layer-4--the-app-builder--planner))

---

## Habits to Improve

1. **Think in trade-offs and failure modes before writing code.**
   Every version doc has a **Traps** table — read it before the slice, not after the bug.
2. **Write the acceptance test first.** It's the definition of done and the antidote to scope creep.
3. **Delete dead code promptly.** `apps/opencode` sat around after being superseded; the Python
   `apps/agent-engine` scaffold is the same story. Carrying dead code costs more than rewriting it.
4. **Keep the docs matching the disk.** The roadmap described a system that no longer existed —
   the audit at the top of [PROJECT_ROADMAP.md](./PROJECT_ROADMAP.md) is the correction. Re-check
   at the end of every version.

---

## Session index

| Session | Date | Focus |
|---|---|---|
| [01](./SESSION_01.md) | 2026-07-14 | Product roadmap, MVP architecture, scaffolding the (Python) engine |
| [02](./SESSION_02.md) | 2026-07-22 | Analysing `ref-ai/packages`; the TS-vs-Python question raised |
| [03](./SESSION_03.md) | 2026-08-10 | *Coding Agents + Cloud* deck → full architecture, V0–V5 ladder, decisions closed |
