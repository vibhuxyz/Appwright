# Session protocol

> **Tool-neutral.** Claude Code wraps these as `/start` and `/wrap`. Any other tool — Gemini CLI,
> Cursor, Copilot, Cline, Aider — can be told *"do the start ritual"* and follow this file.
>
> The rituals are what keep the docs true. Skip them and the docs become fiction within a week.

---

# START

## 1. Read these, in this order. Actually read them.

1. **`docs/README.md`** — which version and slice we are on
2. **`docs/versions/V*.md`** — only the current version's file.
   ⭐ **Its checkboxes are the progress record.** `[x]` = done and verified. That list, not memory,
   is where we pick up.
3. **`~/.ai/SKILLS.md`** — what the user already knows, at three levels.
   **This decides how much you explain:**
   - ✅ **Solid** → skip the explanation, go straight to design
   - 🟡 **Learning** → explain briefly, then make them design it
   - ⬜ **New** → say *"this is new for you"* and use the full 7-step order
4. **`docs/VERSIONS.md`** — the acceptance test for this version. The definition of done.
5. **`docs/DECISIONS.md`** — what is locked (do not reopen) and what is open (may block us)
6. **`docs/CODE_QUALITY.md`** — how code is written here

Read `docs/ARCHITECTURE.md` only if the task touches a layer you are unsure about.
Read the newest `docs/sessions/SESSION_0N.md` for what happened last time.

**Never ask for a pasted session summary.** The docs are the memory.

## 2. Show the tracker

```
━━━━━━━━━━━━━━━━━━━━━━━━━
📍 PROJECT: <name>
📦 PHASE: <version> — <slice>
━━━━━━━━━━━━━━━━━━━━━━━━━
✅ COMPLETED   - …
🚧 IN PROGRESS - …
📌 NEXT        - …
🚫 BLOCKED     - … (reason)
🏁 MILESTONE: … → 🎯 NEXT: …
━━━━━━━━━━━━━━━━━━━━━━━━━
```

Pull it from the docs. **Do not invent status.**

## 3. Check the docs against the code

Two or three spot checks, not an audit: does the file exist, is the function where the doc says,
did the previous slice actually land? **If they disagree, the code wins — say so before we build
on it.** This repo has drifted twice.

## 4. Ask exactly one question

*"Ready to work on [current task], or something else today?"*

Then stop. Don't summarise everything you read. Don't re-explain the architecture.

## The rule for what to teach

```
concepts the current version needs   ×   the user's level in SKILLS.md
                                  =
                          what you teach, and how deep
```

The version doc says **what is required**. `SKILLS.md` says **what is missing**. Teach the overlap.

## The rule for HOW to teach — crash course, not lecture

When something new comes up **mid-work**, it gets a **six-line card**, not a deep dive:

```
What        one plain sentence, no jargon
Why         what hurt before this existed
Like        one analogy from daily life, never from other software
Here        where it shows up in Appwright specifically
Costs       the trade-off
Go deeper   the version where this stops being enough
```

Then **go back to the task.** Do not stack three explanations before writing a line of code.

Write the card into **[`docs/CRASH_COURSE.md`](./CRASH_COURSE.md) immediately** — not at `/wrap`,
by then the wording is gone.

**Full depth is earned, not default.** Use the 7-step order from the global `CLAUDE.md` only when
the current version is *actually about* that concept (leases at V3, IR design at V4), or when the
user asks. A ⬜ **New** rating in `SKILLS.md` means *say "this is new for you"* and give the card —
it does not automatically mean a lecture.

---

# WRAP

Do all seven. Don't ask permission for each — do them and show the diff summary.

## 1. `docs/sessions/SESSION_0N.md`

Next number in sequence, matching the existing format: goal · what we built · **what I implemented
myself** · new concepts · decisions made · mistakes · homework · next session plan.

**"What I implemented myself" is the honest one.** If the user wrote the code, say so. If the tool
wrote it because they said *"just give it"*, say that too. That distinction is the point of the log.

## 2. `docs/README.md`

Move finished items to Completed. Set the new current task. Update Next. Add anything Blocked with
its reason.

**Only mark something complete if it was actually implemented or reviewed together.** Not discussed.

## 3. `docs/DECISIONS.md` — only if a decision was made

New entry: **what · why · what we gave up · when we would revisit** (a measurable trigger, not
"if needed"). Next D number. If one was superseded, mark the old one and leave it — the history of
changing your mind is worth more than a tidy list. Remove anything that moved from open to decided.

## 4. `~/.ai/SKILLS.md` — the global profile

This travels between projects, so keep its ✅ column trustworthy.

- Promote to **✅ Solid** only if **both** are true: they can explain it, **and** they shipped code
  using it this session. Date it, name the project, write one line of evidence.
- Promote to **🟡 Learning** when taught but not shipped.
- Add a row to the Log.

**Never promote because it was discussed.** An inflated ✅ column makes the file useless for its
only job — deciding how much to explain next time.

## 5. `docs/LEARNING.md`

Per-version detail. Note repeated mistakes — repeated ones are the signal worth tracking.

## 6. `docs/CRASH_COURSE.md`

The cards should already be there — they get written the moment a concept is explained, not now.
At wrap, three things:

- Update the **State** column. `🟡 taught` → `✅ shipped` only when code using it exists and runs.
  Same bar as `SKILLS.md`.
- Promote anything from *"mentioned but not yet taught"* that got a real explanation this session.
- If a concept had to be re-explained, date it. **A concept taught twice is the signal worth
  tracking** — the first analogy failed, so replace it rather than adding a second card.

## 7. Tick the version doc

Check off completed items in `docs/versions/V*.md`.

---

## Close with five lines

1. What they did well
2. Biggest weakness this session
3. One production concern they missed
4. One thing to improve next time
5. One advanced topic that naturally follows

**If a whole version finished:** run Milestone Review Mode against `docs/INTERVIEW_PREP.md` — ask
that version's questions, progressively harder, and **push back on weak answers instead of
accepting them.** Then say which answers they could actually defend and which were bluffing.

---

## Finally

Verify the docs still match the disk — paths, filenames, anything referenced. Then list what
changed. **Don't commit unless asked.**
