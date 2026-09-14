---
description: End a Appwright session — write the session note and update the docs so the next session has memory
---

End the session. **The docs are the memory — if you skip this, the next session starts blind.**

Do all seven. Don't ask permission for each one; just do them and show me the diff summary at the end.

## 1. Write `docs/SESSION_0N.md`

Next number in sequence. Match the format of the existing session notes:

```markdown
# Session 0N

**Date:** [today, absolute date]
**Goal of the Session:** [what we set out to do]

## What We Built

## What I Implemented Myself

## New Concepts Learned

## Engineering Decisions Made

## Mistakes I Made

## Homework Before Next Session

## Next Session Plan
```

**"What I Implemented Myself" is the honest one.** If I wrote the code, say so. If you wrote it
because I said "just give it", say that too. That distinction is the whole point of the log.

## 2. Update `docs/README.md`

- Move finished items into **Completed ✅**
- Set the new **Current task 🚧**
- Update **Next up 📌**
- Add anything genuinely **Blocked 🚫**, with the reason

**Only mark something complete if I actually implemented it or we reviewed it together.** Not if we
merely discussed it.

## 3. Update `docs/DECISIONS.md` — only if a decision was made

Any new decision gets: **what · why · what we gave up · when we'd revisit.** Give it the next D
number. If a decision was superseded, mark the old one and leave it — the history of changing our
minds is worth more than a tidy list. If something moved from open to decided, remove it from the
**Open** table.

## 4. Update `~/.ai/SKILLS.md` — the global profile

This one travels between projects, so keep its ✅ column trustworthy.

- Move a topic to **✅ Solid** only if **both** are true: I can explain it, **and** I shipped code
  using it this session. Date it, name the project, and write one line of evidence.
- Move to **🟡 Learning** when it was taught but not yet shipped.
- Add a row to the Log table.

**Never promote something because we discussed it.** An inflated ✅ column makes the file useless
for its only job — deciding how much to explain next time.

## 5. Update `docs/LEARNING.md`

- Move a concept to **Mastered** only if I can explain it _and_ shipped code using it. Date it.
- Add anything new to **Currently Learning**
- If I repeated a mistake, write it down — repeated mistakes are the signal worth tracking

## 6. Update `docs/CRASH_COURSE.md`

The six-line cards should already be in there — they get written the moment a concept is explained,
not at wrap. So here, just three things:

- Update the **State** column. `🟡 taught` → `✅ shipped` only when I have code using it that runs.
- Promote anything from _"mentioned but not yet taught"_ that got a real explanation today.
- If you had to re-explain a concept, date it. **A concept taught twice means the first analogy
  failed** — replace it, don't add a second card.

## 7. Tick the version doc

Check off completed items in `docs/versions/V*.md` for the current version.

---

## Then close with a short review

Five lines, no more:

1. What I did well
2. Biggest weakness this session
3. One production concern I missed
4. One thing to improve next time
5. One advanced topic that naturally follows

## If we finished a whole version — run Milestone Review Mode

Open `docs/INTERVIEW_PREP.md` and ask me that version's questions. Progressively harder. When I
answer weakly, **push back with a hint instead of accepting it** — that's the whole point. Then
tell me which of those answers I could actually defend in an interview and which I was bluffing.

---

## Finally

Verify the docs still match the disk — paths, file names, anything you referenced. This repo has
drifted into describing deleted code before; the audit in `README.md` is the scar.

Then tell me which files changed. Don't commit unless I ask.

$ARGUMENTS
