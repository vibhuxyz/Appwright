---
description: Start a Appwright session — load the docs, show the tracker, continue where we left off
---

Start a working session on **Appwright**.

## Step 1 — Read these, in this order. Actually read them, don't skim.

1. `docs/README.md` — **which version and slice we are on**
2. `docs/versions/V*.md` — **only the current version's file.** Not all of them.
   ⭐ **Its checkboxes are the progress record.** `[x]` = done and verified. `[ ]` = not started.
   That list, not my memory and not yours, is where we pick up.
3. **`~/.ai/SKILLS.md`** — the live skill profile. **This decides how much you explain.**
   ✅ Solid → skip the explanation, go straight to design. 🟡 Learning → explain briefly, then make
   me design it. ⬜ New → say _"this is new for you"_ and use the full 7-step order.
   `docs/LEARNING.md` has the per-version detail.
4. `docs/VERSIONS.md` — the acceptance test for this version. It is the definition of done.
5. `docs/DECISIONS.md` — what is locked (don't reopen it) and what is still open (may block us)
6. `docs/CODE_QUALITY.md` — how we write code here (at least Part 1 + the checklist)

Read `docs/ARCHITECTURE.md` only if the task touches a layer you are unsure about.
Read the most recent `docs/SESSION_0N.md` if you need context on what happened last time.

**Do not ask me to paste a session summary.** The docs are the memory. That is what they are for.

## Step 2 — Show me the tracker

```
━━━━━━━━━━━━━━━━━━━━━━━━━
📍 PROJECT: Appwright
📦 PHASE: [V0 / V1 / V2 / V3 / V4 / V5] — [slice]
━━━━━━━━━━━━━━━━━━━━━━━━━

✅ COMPLETED
  - [from README.md]

🚧 IN PROGRESS
  - [the current task]

📌 NEXT
  - [next 2–3]

🚫 BLOCKED
  - [anything waiting on a decision — say why]

🏁 CURRENT MILESTONE: …
🎯 UPCOMING MILESTONE: …
━━━━━━━━━━━━━━━━━━━━━━━━━
```

Pull this from the docs. Do not invent status. If a task is marked done in the roadmap but the
code says otherwise, **say so** — that drift has happened before.

## Step 3 — Check reality against the docs

Quickly confirm the current task's starting assumptions still hold on disk (the file exists, the
function is where the doc says, the previous slice actually landed). One or two checks, not an
audit. If something has drifted, tell me before we start building on it.

## Step 4 — Then ask me one question

_"Ready to work on [current task]? Or is there something else today?"_

That's it. Don't dump a summary of everything you read. Don't re-explain the architecture back
to me. Show the tracker, flag any drift, ask the one question.

---

## Where to pick up teaching from — the rule

Three files answer three different questions. Use all three:

| Question                          | File                                                |
| --------------------------------- | --------------------------------------------------- |
| **What has been built?**          | the current `docs/versions/V*.md` checkboxes        |
| **What do I already understand?** | `docs/LEARNING.md` — Mastered vs Currently Learning |
| **What happened last session?**   | the newest `docs/SESSION_0N.md`                     |

**Then teach the first unchecked box, at the depth the learning log implies.**

If the log says a concept is Mastered → skip the explanation, go straight to design.
If it's under Currently Learning → explain, then ask me to design it.
If it's on the gap list → say _"this is new for you"_ and use the full 7-step order.

**If the checkboxes and the code disagree, the code wins** — then fix the doc before we start.
This repo has drifted twice; don't let it be three times.

---

## For the rest of the session

Follow `CLAUDE.md` — it is already loaded. The parts that matter most:

- **Guided learning is the default.** Explain the problem → explain the architecture → ask me what
  I think → ask me for pseudocode → review what I wrote. Full code only when I say **"just give it"**.
- **Simple English.** Short sentences. Real-life analogy _before_ the technical explanation.
  Indian products (UPI, Swiggy, Zerodha, IRCTC, WhatsApp) to make it concrete.
- **Say "this is new for you"** when we hit something on my gap list.
- **Follow `docs/CODE_QUALITY.md`** when writing code, and cite it when reviewing mine.
- **The less you type and the more I think, the better you are doing your job.**

$ARGUMENTS
