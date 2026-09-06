# V5 — Browser Agent

> **Goal:** the agent can **use** the app it just built. Open pages, fill forms, click things,
> read what came back, and look at how it renders.
>
> **Status:** 🔴 not started · **Est.** 3–4 weeks · **Depends on:** [V4](./V4_APP_BUILDER.md)

---

## Why this version exists

Up to V4, "done" means **it compiles**:

```
tsc → build → lint → migration applies
```

None of that tells you whether login actually works. A generated app can compile perfectly and
still 500 on the first form submit.

V5 changes the definition of done to **it works**:

```
open /login → type an email → type a password → click Login → assert /dashboard
```

That is the difference between a code generator and something you would let a company use.

**And it is what makes V6's self-healing worth building.** A healer fed `tsc` errors can fix
types. A healer fed *"login returned 500, the API threw on a null user"* can fix the product.
Building the healer first means tuning it against the weaker signal, then re-tuning.

---

## Acceptance test

```
User: "Build a signup page"

  ✓ built  /signup

  ▸ Testing the signup flow…
    ✓ valid email + password        → redirected to /dashboard
    ✓ invalid email format          → inline error shown
    ✓ empty password                → submit blocked
    ✗ duplicate email               → 500, expected "email already in use"
    ✓ password mismatch             → inline error shown

  ▸ Visual check
    ✗ mobile 375px — submit button overflows its container

  2 issues found. Investigating…
```

**Done means:** the agent found real bugs *by using the app*, not by reading the code — including
one the compiler could never catch (the overflow).

---

## Architecture

### It is not a separate agent

The browser is a **tool set**, plugged into the same `runAgentLoop` from V0:

```
runAgentLoop(messages, tools, provider, emit)
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   file tools      shell tools     BROWSER TOOLS   ← new in V5
   read/edit       bash            navigate/click/type/snapshot
```

Same loop, same event stream, same approval gate, same `seq`. Nothing about V0 changes.

### The browser loop

```
   browser_snapshot ──► a SEMANTIC description of the page
            │
            ▼
       agent decides: "click the button named Login"
            │
            ▼
   browser_click({ role: "button", name: "Login" })
            │
            ▼
   browser_snapshot ──► what changed?
            │
            └──────────► repeat until the goal is met or the budget runs out
```

**Look → act → look again.** The agent never clicks blind, exactly as it never edits a file it
has not read.

### Semantic, never coordinates

```
❌  click(x: 532, y: 421)          breaks on any font, layout, or viewport change
✅  click(role: "button",           survives redesigns. Reads like the intent.
          name: "Login")
```

The **accessibility tree** is the page described as roles and names — `button "Login"`,
`textbox "Email"`, `heading "Sign up"`. It is what a screen reader sees, and it is a far better
interface for an agent than pixels.

Playwright's `getByRole` is built on exactly this.

> **Side effect worth knowing:** an app the agent can drive semantically is an app that is
> accessible. If `getByRole("button", { name: "Login" })` finds nothing, the generated markup has
> an a11y problem — and now you have detected it automatically.

---

## TODO

### Slice 1 — Playwright in the sandbox
- [ ] Add Chromium + Playwright to the sandbox image. It is large — measure the cold-start cost
      before and after, because [D19](../DECISIONS.md#decision-19-object-storage--snapshots-and-dumps-not-git--active-target-v3)'s
      snapshots have to carry it.
- [ ] `BrowserSession` behind an interface, the same way `ExecutionEnv` is
      ([CODE_QUALITY.md §3](../CODE_QUALITY.md)) — so a fake exists for tests.
- [ ] One browser per session, reused across tool calls. Launching per call is far too slow.
- [ ] Hard limits: page-load timeout, action timeout, max actions per run.

### Slice 2 — The tools
- [ ] `browser_navigate(url)`
- [ ] `browser_snapshot()` → the accessibility tree, **truncated** (see traps)
- [ ] `browser_click({ role, name })`
- [ ] `browser_type({ role, name, text })`
- [ ] `browser_select({ role, name, option })`
- [ ] `browser_wait_for({ role, name })` — never a bare sleep
- [ ] `browser_screenshot()` → key in the bucket
- [ ] `browser_console()` → runtime errors the page logged. **Cheap, and catches a lot**
- [ ] `browser_network()` → failed requests, non-2xx responses
- [ ] All of them `executionMode: "sequential"` — a browser has one cursor
      ([CODE_QUALITY.md §12](../CODE_QUALITY.md))

### Slice 3 — Authoring tests
- [ ] The blueprint's `pages` and `features` become **test intents**: signup → happy path, each
      validation rule, the duplicate case.
- [ ] LLM writes the **intent** (*"a duplicate email should show an inline error"*).
      Deterministic code runs it. Same split as [D9](../DECISIONS.md#decision-9-deterministic-engines-over-bigger-prompts--active-target-v4).
- [ ] Persist test intents so the same suite re-runs on every future change — this is how a
      returning user's change gets caught breaking an old feature.
- [ ] **Reset the database between test cases.** Otherwise test 2 fails because test 1 already
      created that user, and the agent "fixes" a bug that does not exist.

### Slice 4 — Visual checking
- [ ] Screenshot at 3 viewports: 375 (mobile), 768 (tablet), 1440 (desktop).
- [ ] Store in the bucket, keyed by `project/session/page/viewport`.
- [ ] **Start with rule-based checks, not pixel diffing:** horizontal overflow
      (`scrollWidth > clientWidth`), elements at negative coordinates, zero-height containers that
      should have content, text overlapping. These are deterministic, cheap, and catch most real
      breakage.
- [ ] Pixel diffing **only against a previous run of the same project**. Never against a "correct"
      baseline — there isn't one for a freshly generated app.
- [ ] A vision-model pass (*"does this look broken?"*) is the last resort, not the first tool.

### Slice 4b — Requested-change and regression checking
- [ ] **Deepen [V4.5](./V4_5_VISUAL_EDITOR.md)'s requested-change verification**, do not rebuild it.
      V4.5 already asserts `asked 286 → rendered 286`
      ([D51](../DECISIONS.md#decision-51-verification-checks-the-request-that-was-made-not-a-general-notion-of-good--active-target-v45-deepens-at-v5)).
      V5 adds the checks that need a driven browser: *"sticky"* → scroll and re-measure,
      *"side by side"* → same row.
- [ ] **UI regression detection.** An agent fixing a button must not silently break the navbar —
      compare DOM snapshots and screenshots against **the previous run**, never an absolute ideal.
- [ ] Full-page checks across the four viewports: 390 · 768 · 1024 · 1440. Overflow, alignment,
      clipping, text wrapping, hierarchy, contrast, focus, label presence, target size.
- [ ] **The UI quality score is advisory and deterministic.** Every dimension is measured —
      contrast from computed colors, spacing from distance to the token scale, reuse from registry
      hits over total elements. It generates optimisation tasks; **it never gates a task**, and no
      model rates its own output ([D32](../DECISIONS.md#decision-32-risk-is-its-own-axis-and-it-can-only-raise-the-bar--active-target-v4)).
- [ ] Cap the per-run cost. Screenshots at four viewports across every changed route, retained,
      adds up fast ([O22](../DECISIONS.md#open--not-yet-decided)).

### Slice 5 — Wire it into verification
- [ ] Extend the verification tiers ([D21](../DECISIONS.md)): compile → run → **interact** → **look**.
- [ ] A task is not green until its tier passes.
- [ ] Emit browser events into the same stream — the user watches the agent click through their app.
      This is a genuinely great demo, and it is free once `emit` is threaded.

### Slice 6 — Prove it
- [ ] The full acceptance test above.
- [ ] Plant a runtime bug the compiler cannot see (an API that throws on a null field). The browser
      test must catch it.
- [ ] Plant a CSS overflow at 375px. The visual check must catch it.
- [ ] Run the suite twice with no changes. **Identical results both times** — if it is flaky, it is
      worse than useless, because the healer in V6 will chase ghosts.

---

## Files this version touches

```
NEW  libs/ts/browser/src/session.ts      BrowserSession interface + Playwright adapter
NEW  libs/ts/browser/src/snapshot.ts     accessibility tree → compact text, truncated
NEW  libs/ts/browser/src/visual.ts       rule-based layout checks
NEW  libs/ts/tools/src/browser.ts        the tool definitions
EDIT libs/ts/agent-core/src/types.ts     browser_* event variants
EDIT libs/ts/verify/src/*                add the interact + look tiers
EDIT libs/ts/db/prisma/schema.prisma     TestIntent, TestRun, Screenshot
EDIT services/web/src/*                  render browser steps + screenshots in the stream
```

---

## Traps

| Trap | Symptom | Fix |
|---|---|---|
| **Coordinates instead of roles** | Tests break on every style change | Accessibility tree only |
| **Untruncated snapshots** | One complex page fills the context window | Truncate like file reads — depth limit + interactive elements first |
| **`sleep` instead of waiting** | Flaky. Passes on your machine, fails in CI | `wait_for` a role/name, never a timer |
| **No DB reset between cases** | Test 2 fails from test 1's data; agent "fixes" a non-bug | Reset or transaction-rollback per case |
| **Pixel diff against a "correct" baseline** | Everything fails — there is no baseline for new code | Diff against the previous run only |
| **Testing against HMR dev server** | Random failures mid-hot-reload | Production build for test runs |
| **Vision model as the first tool** | Slow, expensive, vague | Rule-based checks first; vision last |
| **Flaky suite** | V6's healer chases ghosts and burns budget | Slice 6's "run it twice" gate |
| **Browser per tool call** | 2s of launch overhead per click | One browser per session |

---

## Concepts to learn here

Accessibility tree / ARIA roles · Playwright locators and auto-waiting · deterministic vs flaky
tests · visual regression · headless browsers in containers · why semantic selectors survive
refactors. See [LEARNING.md](../LEARNING.md).

---

## Definition of done

- [ ] The agent finds a real runtime bug **by using the app**, not by reading code.
- [ ] The agent finds a real layout bug at 375px.
- [ ] Every browser action is semantic — zero coordinate-based clicks in the codebase.
- [ ] The suite runs twice with identical results.
- [ ] Browser steps stream to the UI as they happen.
- [ ] `bun run check-types` and `bun test` green.
