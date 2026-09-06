# V4.5 — Visual Editor

> **Goal:** the user clicks a thing in the preview, drags it, and it changes. No prompt, no
> tokens, no waiting for a model to guess which file they meant.
>
> **Status:** 🔴 not started · **Est.** 3–4 weeks · **Depends on:** [V4](./V4_APP_BUILDER.md)

---

## Why this version exists

After V4 the only way to say *"that card is too wide"* is to type it and hope. Three things go
wrong, every time:

| | |
|---|---|
| **Ambiguity** | *"that card"* — which one? The model reads files and guesses |
| **Invention** | *"a bit narrower"* → the model picks `286px`, or `280px`, or `w-72`. It is choosing a number the user already had in their head |
| **Cost** | a full planner → agent → verify cycle, tokens and 40 seconds, to change one padding value |

The user already knows the answer. They know it as a gesture, not as a sentence. **Every visual
change routed through natural language is a lossy encode followed by a lossy decode.**

This version removes the model from the changes that never needed it.

```
V4          "make the revenue card narrower"  ──► LLM guesses ──► maybe
V4.5        drag the edge to 286px            ──► deterministic ──► exactly
```

The model stays for the half that genuinely needs judgement — *"make this feel more premium"* —
which is [D50](../DECISIONS.md#decision-50-two-interaction-modes--exact-edits-never-reach-the-model--active-target-v45)'s
whole point.

### Why it is a half-rung, and what that costs

**This rung was placed at 4.5 deliberately, against the recommendation to put it after V6.** The
argument that won: it is the differentiating feature, and shipping it behind two more full
versions delays the thing users would actually pay for.

**The recorded cost:** an editor that changes the UI, built *before* [V5](./V5_BROWSER_AGENT.md)'s
browser agent, cannot check its own output the way V5 will.

**The mitigation, and the reason this is survivable:** V4.5 does not need V5. It needs one much
narrower thing — **verify the change that was requested, not whether the page looks good**
([D51](../DECISIONS.md#decision-51-verification-checks-the-request-that-was-made-not-a-general-notion-of-good--active-target-v45-deepens-at-v5)).
That is a `boundingBox()` call and a numeric compare. No semantic clicking, no accessibility tree,
no vision model, no LLM at all.

```
V4.5   "I asked for 286px. Is it 286px?"        one measurement, deterministic
V5     "does this page work, and is it broken?"  the browser agent
```

The narrow check is genuinely easier than the general one, and it is also **the more useful of the
two here** — a user who dragged a value to 286 does not want a quality score, they want their
number. Do not let V5's ambition leak backwards into this rung.

---

## Acceptance test

1. Open a V4-generated app in the preview pane. Click **Edit**.
2. Click the revenue card. The property panel opens, showing **its real current values** — not
   defaults, not blanks.
3. Drag its width to `286px`. Set padding `16px`. Set radius `8px`.
4. Click the navbar. Set height `64px`. **Nothing has been written to disk yet** — the header
   reads `4 pending changes · 2 components`.
5. Click **Submit**. One run applies all four.
6. **The rendered width is measured at exactly 286px.** Not "about right" — measured, and reported
   as a check that passed.
7. The diff shows Tailwind scale classes (`w-[286px]` is acceptable; `p-4` and `rounded-lg` are
   **required** — 16px and 8px are on the token scale and must compile to it).
8. `git diff` on the generated repo contains **no `data-aw-id` anywhere.**
9. Type *"make this section feel more premium"* on the same card → this one **does** go to the
   model, and comes back as a normal reviewable diff.

**The one that defines the version:** step 6. A visual editor that cannot prove it produced the
number it was given is a suggestion box.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│ PREVIEW  (iframe, dev build)                             │
│   click ──► data-aw-id ──► postMessage to parent         │
└──────────────────────┬───────────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────────┐
│ EDITOR  (services/web)                                   │
│   component graph lookup ──► property panel              │
│   drag / type ──► DesignState  (PENDING, in memory + DB) │
└──────────────────────┬───────────────────────────────────┘
                       │  Submit
                       ▼
┌──────────────────────────────────────────────────────────┐
│ CHANGESET COMPILER   (deterministic — no LLM)            │
│   validate ──► detect conflicts ──► snap to tokens       │
│   ──► affected components ──► affected files ──► UI DAG  │
└──────────────────────┬───────────────────────────────────┘
                       ▼
              ┌────────────────┐
              │  exact edits   │──► deterministic codemod ──► files
              │  intent edits  │──► agent (V4 loop) ────────► files
              └────────┬───────┘
                       ▼
┌──────────────────────────────────────────────────────────┐
│ REQUESTED-CHANGE VERIFICATION                            │
│   Playwright ──► boundingBox() ──► asked 286, got 286 ✅  │
└──────────────────────┬───────────────────────────────────┘
                       ▼
              DesignState DISCARDED — the repo is the truth
```

### The three pieces that make it work

**1. Identity — injected, never authored**
([D49](../DECISIONS.md#decision-49-appwright-identity-is-injected-at-build-time-never-written-into-source--active-target-v45)).
An SWC plugin adds `data-aw-id` during the **dev** build only. The generated repo never contains
one. Export needs no strip pass, because there is nothing to strip.

**2. Staging — the buffer is not a source of truth**
([D48](../DECISIONS.md#decision-48-designstate-is-a-staging-buffer--the-repo-is-the-only-durable-visual-truth--active-target-v45)).
`DesignState` exists between *drag* and *applied*. When the run goes green the rows are discarded.
Nothing persists, so nothing can drift from the code.

**3. Routing — exact edits never reach the model**
([D50](../DECISIONS.md#decision-50-two-interaction-modes--exact-edits-never-reach-the-model--active-target-v45)).
`width = 286px` is a codemod. *"feel more premium"* is a prompt. Sorting them at the door is what
makes this version fast and cheap instead of just prettier.

---

## TODO

### Slice 1 — The component graph
- [ ] `Component` table: `id` (`dashboard.revenue-card`), `projectId`, `parentId`, `route`,
      `sourceFile`, `sourceRange`, `blueprintVersion`.
- [ ] Built **deterministically** at generation time by parsing the AST — not by asking the model
      what it just wrote. Same rule as [D30](../DECISIONS.md#decision-30-a-task-declares-what-it-owns-and-what-it-reads--and-that-declaration-is-the-graph--active-target-v4):
      a declaration the machine can check beats prose the machine must trust.
- [ ] Rebuild the graph after every task that touches a component file. **A stale graph maps a
      click to the wrong file**, which is the worst failure this version has.
- [ ] `GET /projects/:id/components` — the tree the editor renders as a layer panel.

### Slice 2 — Build-time identity
- [ ] SWC plugin: inject `data-aw-id` on every element that the component graph knows about.
- [ ] **Dev build only.** Wire it so a production build cannot include it even by accident — the
      plugin is absent from the prod config, not disabled by a flag inside it.
- [ ] Ids must be **stable across rebuilds** — derive from `route + component path + ordinal`,
      never from a counter or a hash of the file's bytes. See [O20](../DECISIONS.md#open--not-yet-decided).
- [ ] Verify: `git diff` in a generated project after a full build shows no `data-aw-id`.

### Slice 3 — Selection and the property panel
- [ ] Preview iframe posts `{ awId, rect }` to the parent on click. Same-origin only.
- [ ] Panel reads the component's **current computed values** and shows them. A panel that opens
      showing blanks or defaults teaches the user their edit is a fresh guess — it is not.
- [ ] Groups: Layout · Typography · Appearance · Responsive (per [#6](#the-property-panel)).
- [ ] Every numeric input **snaps to the token scale** by default, with an explicit escape for a
      raw value ([O23](../DECISIONS.md#open--not-yet-decided)). Nudging to `17px` should be
      possible and should feel like leaving the path.
- [ ] Direct manipulation for the four that are genuinely gestural: width, height, padding, gap.

### Slice 4 — DesignState and batching
- [ ] `DesignState` rows: `componentId`, `property`, `from`, `to`, `breakpoint`, `status=pending`.
- [ ] Header shows `N pending changes · M components` with a Submit button. **Nothing runs until
      Submit** — this is the latency and token decision, not a UI nicety.
- [ ] Discard on success; roll the buffer back on failure. A half-applied ChangeSet must not leave
      pending rows that no longer describe anything.
- [ ] Undo/redo inside the buffer, which is free while it is the only writer.

### Slice 5 — The ChangeSet compiler (deterministic, no LLM)
- [ ] Validate every change against the token scale and the component registry.
- [ ] **Conflict detection before anything executes** — `width: 100%` and *"place beside
      OrdersCard"* cannot both hold. Surface it and make the user choose. This is
      [D39](../DECISIONS.md#decision-39-plan-validation-is-a-gate-never-a-repair--active-target-v4)'s
      rule applied to a new input: **reject and ask, never repair.**
- [ ] Compile `ChangeSet → affected components → affected files → UI task DAG`. Only the necessary
      tasks execute — the incremental path from
      [V4 Slice 8](./V4_APP_BUILDER.md), reused rather than rebuilt.
- [ ] Ownership still governs. Two changes touching one file **serialise**
      ([D37](../DECISIONS.md#decision-37-ownership-is-normalised-and-covers-more-than-files--active-target-v4-closes-o9)).

### Slice 6 — Applying changes
- [ ] **Exact edits → a codemod.** Parse the JSX, replace the class, write it back. No model call,
      no tokens, no budget check, and the result is the number the user typed.
- [ ] **Intent edits → the V4 agent loop**, unchanged, with the component's files as the context
      scope. It gets the same task-scoped context any other task gets.
- [ ] A ChangeSet containing both runs the codemods **first**, then the agent — so the model sees
      the exact values already applied and does not re-litigate them.

### Slice 7 — Requested-change verification
- [ ] Playwright, one browser per session ([V5 trap](./V5_BROWSER_AGENT.md), borrowed early).
- [ ] For every applied change, assert the **rendered** result:

| Requested | Asserted |
|---|---|
| `width = 286px` | `boundingBox().width === 286` |
| `padding = 16px` | computed style, all four sides |
| *"make the navbar sticky"* | scroll 500px, navbar still in viewport |
| *"put these side by side"* | both boxes share a `y`, differ in `x` |

- [ ] A failed assertion is a **failed task with the real numbers in it** — `asked 286, rendered
      320` — not a retry prompt saying "it didn't work".
- [ ] Cap the retry budget. An exact edit that fails twice is a codemod bug, not a model problem,
      and looping on it hides that.

### Slice 8 — Prove it
- [ ] All nine acceptance steps.
- [ ] **Export probe:** export a project that has been visually edited twenty times. `grep -r
      "data-aw-id"` returns nothing. It builds and runs outside Appwright.
- [ ] **Drift probe:** edit a component visually, then have the agent edit the same file by prompt,
      then reopen the editor. The panel shows the agent's values — because it read the code, and
      the code is the truth ([D48](../DECISIONS.md#decision-48-designstate-is-a-staging-buffer--the-repo-is-the-only-durable-visual-truth--active-target-v45)).
- [ ] **Cost probe:** ten exact edits in one ChangeSet must cost **zero LLM tokens.** If they do
      not, the routing in [D50](../DECISIONS.md#decision-50-two-interaction-modes--exact-edits-never-reach-the-model--active-target-v45)
      is not wired.

---

## The property panel

```
Layout            Typography          Appearance        Responsive
├── width         ├── font            ├── color         ├── desktop  1440
├── height        ├── size            ├── background    ├── tablet   1024
├── min / max     ├── weight          ├── opacity       ├── mobile    390
├── margin        ├── line height     ├── border        └── (edits are
├── padding       ├── letter spacing  ├── radius            per-breakpoint,
├── gap           └── transform       └── shadow            never global)
├── position
├── display
├── flex
└── grid
```

Editing at the `tablet` breakpoint writes `md:` variants, never bare classes. **Responsive is a
dimension of every edit, not a cleanup pass** ([D47](../DECISIONS.md#decision-47-the-blueprint-has-a-design-section-and-it-is-the-source-of-truth-for-visual-decisions--active-target-v4)).

---

## Files this version touches

```
NEW  libs/ts/ui-system/src/registry/*     component registry + allowed variants
NEW  libs/ts/ui-system/src/tokens/*       colors · spacing · typography · radius · shadows
NEW  libs/ts/design/src/graph.ts          component graph builder (AST, deterministic)
NEW  libs/ts/design/src/changeset.ts      validate · conflicts · snap · compile to a DAG
NEW  libs/ts/design/src/codemod/*         exact edits, no LLM
NEW  tooling/swc-aw-id/                   dev-only identity injection
EDIT services/web/src/*                   edit mode · selection · property panel · pending bar
EDIT services/api/src/routes/*            components · designstate · changeset
EDIT libs/ts/db/prisma/schema.prisma      Component · DesignState
EDIT libs/ts/planner/src/*                ChangeSet enters the incremental re-planner
```

---

## Traps

| Trap | Symptom | Fix |
|---|---|---|
| **Design State made durable** | The panel and the code disagree, and nobody knows which is right | It is a staging buffer. Discard on success ([D48](../DECISIONS.md#decision-48-designstate-is-a-staging-buffer--the-repo-is-the-only-durable-visual-truth--active-target-v45)) |
| **`data-aw-id` written into source** | The user exports their app and finds our markers in it | Build-time injection ([D49](../DECISIONS.md#decision-49-appwright-identity-is-injected-at-build-time-never-written-into-source--active-target-v45)) |
| **Stale component graph** | A click maps to the file that used to be there | Rebuild after every task that touches a component |
| **Exact edits routed to the model** | Ten drags cost a dollar and return `280px` | Sort at the door ([D50](../DECISIONS.md#decision-50-two-interaction-modes--exact-edits-never-reach-the-model--active-target-v45)) |
| **Apply on every drag** | A build per mouse-up; the preview thrashes | Batch behind Submit |
| **Arbitrary pixel values** | `p-[17px]` everywhere; the design system is decorative | Snap to the scale; raw values are an explicit escape ([O23](../DECISIONS.md#open--not-yet-decided)) |
| **Verifying "looks good"** | A quality score passes while the user's 286px is 320px | Verify the request that was made ([D51](../DECISIONS.md#decision-51-verification-checks-the-request-that-was-made-not-a-general-notion-of-good--active-target-v45-deepens-at-v5)) |
| **Desktop-first, mobile later** | Every session ends with "now fix mobile" | Breakpoint is a property of the edit |
| **Unstable ids** | Yesterday's edits point at nothing after a rebuild | Derive from route + path + ordinal ([O20](../DECISIONS.md#open--not-yet-decided)) |
| **The editor becomes V5** | Scope doubles; neither version ships | V4.5 measures one requested number. That is all |

---

## Concepts to learn here

Design tokens as a constraint system · AST codemods vs prompting · build-time instrumentation ·
staging buffers and single-source-of-truth · direct manipulation vs command interfaces ·
`postMessage` and cross-frame protocols. See [CRASH_COURSE.md](../CRASH_COURSE.md).

---

## Definition of done

- [ ] A user changes four properties across two components, submits once, and gets exactly those
      four values.
- [ ] Exact edits cost **zero** LLM tokens, measurably.
- [ ] An exported project contains no Appwright markers and builds standalone.
- [ ] The property panel and the code never disagree, because only one of them is durable.
- [ ] Every applied change is verified against what was **asked for**, with real numbers in the
      failure message.
