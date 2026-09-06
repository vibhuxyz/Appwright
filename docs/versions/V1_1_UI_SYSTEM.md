# V1.1 — UI System

> **Goal:** the agent composes UI from a known vocabulary of good primitives instead of inventing
> one per file. Same prompt, two templates, output that looks like one product.
>
> **Status:** ✅ done 2026-08-22 · **Est.** 1 week · **Depends on:** [V1](./V1_WEB_APP.md)

---

## Why this version exists

**This rung is justified by a felt limitation, not by anticipation.** V1 shipped on 2026-08-16.
The agent works, the loop chains, the preview renders — and what it renders reads as a first draft.
That is the trigger, and the repo's rule (*never optimise before feeling the limitation*) is
satisfied because the limitation was seen in a working product, not predicted.

There is also evidence that does not depend on taste. `templates/vite-react/src/index.css`, the
**pristine** starter every project is copied from, already ships a hand-rolled proto-design-system:

```css
.btn           { @apply py-4 px-4 ... rounded-[30px] text-lg ... }
.head-text     { @apply mt-4 text-6xl leading-[72px] ... }
.section-text  { @apply text-[32px] font-semibold }
```

`rounded-[30px]` · `leading-[72px]` · `text-[32px]` — **off-scale invented values, in the file
every generated app inherits.** [D46](../DECISIONS.md#decision-46-the-ui-system-is-a-registry-and-a-token-scale-and-the-agent-composes-from-it--active-target-v11-enforced-at-v4)
exists to stop exactly this, and it is already in the template. The agent is not the first thing
inventing values here; the starter is.

### What this rung is, and what it is not

The UI system splits by **dependency**, and only one half needs the planner:

```
V1.1  ecosystem + tokens + registry + prompt rules     depends on NOTHING
      shadcn/ui · Radix · Lucide · token files · a registry the agent reads

V4    the validator that REJECTS · Blueprint design block · design review · variants
      needs the Blueprint and per-task verification, neither of which exists yet
```

**V1.1 gives the agent a vocabulary. V4 gives it a grammar with consequences.** At V1.1 the
registry is guidance the agent reads and the token scale is what the template teaches by example.
Nothing fails a build yet — enforcement arrives with V4's per-task verification, because there is
nothing to fail against until tasks exist.

Do not try to build the validator here. Without a Blueprint there is no `design` block to validate
against, and a validator with no plan behind it is a linter that will be rewritten in six weeks.

---

## Acceptance test

1. Create a project on **`vite-react`**. Prompt: *"build a pricing page with three tiers."*
2. Create a project on **`nextjs-fullstack`**. Same prompt.
3. Both pages use shadcn `Card` and `Button`, Radix behaviour, and Lucide icons — **the agent did
   not hand-roll a button.**
4. `git diff` on both workspaces contains **zero arbitrary bracket values** — no `p-[17px]`, no
   `rounded-[11px]`, no `text-[32px]`.
5. **Put the two previews side by side. They look like the same product.** Different framework,
   different template, one design system.
6. `grep -rn "rounded-\[30px\]" templates/` returns nothing — the proto-system in `index.css` is
   gone, replaced by tokens.

**The one that defines the version:** step 5. Two templates, one look, is the only proof that the
tokens actually live in the shared library and not in two copies that will drift apart.

### Result — run 2026-08-22

All six pass. Both runs used the real agent against a scratch copy of each template, then the two
builds were served side by side in a browser.

| Step | Result |
|---|---|
| 3 — composed, not hand-rolled | Both imported `Card`, `Button`, `Badge` and `lucide-react`. Neither wrote a button. |
| 4 — zero bracket values | Zero, **on the second run.** See below. |
| 5 — one look | Same primary blue, same badge, same card radius and border, same button shapes, same check icons. Different frameworks, one product. |
| 6 — proto-system gone | `grep` clean; the `.btn`/`.head-text`/`.section-text` block is deleted from both stylesheets. |

**Step 4 failed the first time, and how it failed is the useful part.** Given one prompt, *both*
templates independently produced `tracking-[0.2em]` for an uppercase eyebrow label. They converged
on the same bracket value because they were solving the same real problem: **the scale had no
letter-spacing in it at all**, and Tailwind's own tracking scale stops at `0.1em`.

That is [O23](../DECISIONS.md#open--not-yet-decided) — the token-scale escape hatch — arriving on
day one rather than at V4. The answer taken is the one the rung implies: **`tracking-caps` was
added to the scale once**, not a bracket value per file, and not a looser rule. Re-run: zero
bracket values in either diff.

The convergence is worth noting on its own. Two models, two frameworks, two prompts' worth of
independent generation, reaching for the *same* missing value is not noise — it is the scale
telling you where its hole is. **A repeated bracket value is a feature request for the token
scale.** That heuristic is what V4's validator should surface rather than merely reject.

---

## Architecture

```
                    libs/ts/ui-system/            ← ONE definition
                    ├── src/tokens/     colors · spacing · typography · radius
                    │                   shadows · breakpoints · letterSpacing
                    ├── src/registry/   Button → shadcn/ui, variants, allowed: true
                    ├── src/emit/       tokens → CSS · components → templates
                    ├── src/prompt.ts   the registry, compressed for the prompt
                    ├── components/     the nine primitives, vendored once
                    └── bin/emit.ts     writes both templates · --check guards drift
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
    templates/vite-react          templates/nextjs-fullstack
      src/tokens.css                src/app/tokens.css     ← generated, identical
      src/components/ui/*           src/components/ui/*    ← generated, + "use client"
                └─────────────┬─────────────┘
                              ▼
                buildSystemPrompt() injects uiSystemPromptSection()
                    "compose from these; do not invent"
```

`layouts/` and `rules/` are deliberately absent. Neither had a caller, and an unused folder is the
same trap as a fortieth registry entry.

**Tokens are defined once and consumed twice.** That is the whole reason this choice was made over
installing into one template — two token files are two design systems with a shared name, and they
diverge on the first edit nobody mirrors.

**The cost, recorded — and one half of it turned out to be avoidable.** `vite-react` may still
become dead weight the moment [D14](../DECISIONS.md#decision-14-the-generator-produces-full-stack-apps--active-target-v4-closes-o1)'s
full-stack generation lands at V4; that is accepted deliberately, because it keeps V1's shipped,
working default template untouched and it **proves the library is template-agnostic**, which is
the property V4 depends on and would otherwise discover late.

But *"two shadcn installs to keep in sync"* is **not** a cost we ended up paying. The components
live in `libs/ts/ui-system/components/` exactly once and are emitted into both templates by the
same script that emits the tokens. What replaced that cost is smaller and different: **two
generated trees that can be hand-edited and silently drift.** The guard is explicit — `bun run
ui:check` fails on any difference, and a test compares every emitted file to what the emitter
would write today. A cost you can detect automatically beats a cost you have to remember.

---

## TODO

### Slice 1 — Resolve the naming collision first
- [x] **`libs/ts/ui` is `@repo/ui`, a Turborepo starter leftover** — `button.tsx`, `card.tsx`,
      `code.tsx`, and **verified zero importers** across `services/`, `libs/`, and `templates/`.
- [x] Delete it, or rename it to something that cannot be confused with the new package.
      [ARCHITECTURE §14](../ARCHITECTURE.md#14-the-generated-application--what-it-is-and-what-it-owns)'s
      rule is **two of everything** — Appwright owns one set of things, the generated app owns
      another. `ui` (ours, dead) sitting beside `ui-system` (theirs, load-bearing) is a trap for
      precisely that confusion, and it costs nothing to remove *before* the second package exists.
- [x] Do this **first**. Renaming after `ui-system` lands means touching both.

**Done.** Deleted. Zero importers re-verified across `services/`, `libs/`, `templates/` before
removal — the only remaining references were in these docs.

### Slice 2 — The token scale
- [x] `libs/ts/ui-system/tokens/` — `colors.ts`, `spacing.ts`, `typography.ts`, `radius.ts`,
      `shadows.ts`, `breakpoints.ts`. Plain TypeScript objects, exported and typed.
- [x] Emit them as Tailwind theme config **and** as CSS variables, so both templates consume one
      source rather than each redeclaring the scale.
- [x] **Delete the proto-system from `templates/vite-react/src/index.css`** — `.btn`,
      `.head-text`, `.section-text`, `.small-text`, `.paragraph-text`. Replace with token-driven
      equivalents. Check `nextjs-fullstack`'s stylesheet for the same pattern.
- [x] Keep the existing animation utilities (`fade-in`, `slide-up`, `scale-in`). They are a
      genuine shared vocabulary and they are not the problem.

### Slice 3 — The component registry
- [x] `libs/ts/ui-system/registry/` — one entry per primitive:

```json
{
  "Button": { "source": "shadcn/ui", "variants": ["default","secondary","outline","ghost"],
              "sizes": ["sm","md","lg"], "allowed": true },
  "Card":   { "source": "shadcn/ui", "variants": ["default"], "allowed": true }
}
```

- [x] Typed, and **exported as data** — the same object feeds the system prompt now and the V4
      validator later. One definition, two jobs, which is
      [D10](../DECISIONS.md#decision-10-one-type-definition-shared-by-import--active-replaces-the-codegen-plan)'s
      habit applied again.
- [x] Start with what a real page needs: Button · Card · Input · Label · Select · Dialog · Badge ·
      Table · Tabs. **Nine, not forty.** An unused registry entry is inventory with no demand, and
      [V4's trap](./V4_APP_BUILDER.md#traps) is explicit about this — *prove the loop, then add
      blocks*.

### Slice 4 — Install into both templates
- [x] `shadcn/ui` + Radix + Lucide in `templates/vite-react` and `templates/nextjs-fullstack`.
- [x] Point both at the shared tokens. **Neither template redefines a scale value.**
- [x] `bun install` clean in both; both still boot and serve.
- [x] Confirm the workspace copy still excludes `node_modules` ([V1 trap](./V1_WEB_APP.md#traps)) —
      shadcn adds real weight, and copying it would put project creation back at 90 seconds.
      **Also added `dist`, `.next`, `.turbo` to the excludes**: stale build output in a fresh
      workspace is worse than slow, because the dev server can serve the template's prebuilt page
      instead of the agent's edits and the preview then lies about what was generated.

**Done, with a deviation worth recording.** The primitives were **vendored by hand into
`libs/ts/ui-system/components/` and emitted**, not installed with `bunx shadcn@latest init`. The
CLI is interactive, needs network, writes its own `components.json`, and — decisively — **rewrites
`globals.css` with its own token block**, which would have overwritten the generated `tokens.css`
wiring this rung exists to create. shadcn's model is *source you own*, so vendoring is not a
workaround; it is the supported shape.

**The recorded cost of "two shadcn installs to keep in sync" was avoidable and is now gone.** The
components live in the library exactly once and are emitted into both templates by the same script
that emits the tokens, with the same `--check` drift guard. The only per-template difference is
data, not a copy: `CLIENT_COMPONENTS` decides which files get `"use client"` under Next's App
Router — a missing directive there is a 500 at runtime, not a type error, so `tsc` would never
catch it.

### Slice 5 — Teach the agent the vocabulary
- [x] Inject the registry into `libs/ts/agent-core/prompts/system.md`, alongside the file tree that
      is already injected there.
- [x] State the rule plainly: **compose from these primitives; do not hand-roll one that exists.**
- [x] State the scale rule: **use scale classes (`p-4`, `rounded-lg`); a bracket value is a last
      resort, not a default.**
- [x] Keep it **short**. This competes for the same context budget as everything else, and a
      registry dumped in full is [O8](../DECISIONS.md#open--not-yet-decided)'s problem arriving
      early. Names and variants — not descriptions. **~1.4k chars, test-enforced under 2.5k.**
- [x] **The old prompt actively contradicted this rung and had to go.** `system.md` *instructed*
      the agent to use `.btn`, `.head-text`, `.section-text` — the very utilities Slice 2 deletes.
      Deleting them without rewriting that block would have left the agent writing class names
      that match nothing: no error, types pass, build succeeds, app renders unstyled.
- [x] **Exclude `src/components/ui/*` from the injected file tree.** Nine primitives ate 10 of the
      50 tree slots restating what the registry section had just said. Filtered in
      `buildSystemPrompt`, **not** in `Runtime.listDir` — `list_files` is a tool the agent calls,
      and a tool that hides real files from its caller is a tool that lies.

### Slice 6 — Prove it
- [x] All six acceptance steps.
- [x] **The side-by-side is the demo.** Two templates, one prompt, one look.
- [x] Re-run V1's acceptance test unchanged. **V1.1 must not break a shipped rung** — if the
      dark-mode-toggle test no longer passes, this rung is not done. **Re-run live in the browser
      2026-08-22 and it passes**, including the mid-run hard refresh. The toggle works because the
      agent only had to flip a class: `.dark` in the generated `tokens.css` redefines every
      semantic colour, so it never had to invent a dark palette. That is the token system paying
      for itself on the first test that touches it.

---

## Files this version touches

```
NEW  libs/ts/ui-system/tokens/*        colors · spacing · typography · radius · shadows · breakpoints
NEW  libs/ts/ui-system/registry/*      the primitives the agent may compose
DEL  libs/ts/ui/                       @repo/ui — starter leftover, zero importers
EDIT templates/vite-react/*            shadcn + Radix + Lucide; index.css proto-system removed
EDIT templates/nextjs-fullstack/*      same
EDIT libs/ts/agent-core/prompts/system.md   the registry, injected
```

---

## Traps

| Trap | Symptom | Fix |
|---|---|---|
| **Building the validator here** | A linter with no Blueprint to validate against, rewritten at V4 | Vocabulary now, enforcement at V4 |
| **Tokens copied into each template** | They drift on the first edit nobody mirrors | One definition in `libs/ts/ui-system`, consumed twice |
| **Leaving `@repo/ui` in place** | `ui` and `ui-system` side by side; §14's *two of everything* blurs | Delete it in Slice 1, before the second package exists |
| **Forty registry entries** | Weeks of inventory before one page is generated | Nine primitives. Add on demand |
| **Full registry in the prompt** | Context budget spent on components this task will not use | Names and variants only |
| **Leaving the `.btn` utilities** | The template keeps teaching `rounded-[30px]` by example | Delete them; the starter is the strongest prompt there is |
| **Copying `node_modules`** | Project creation back to 90 seconds | The V1 exclusion still applies, and shadcn makes it matter more |
| **Breaking V1** | A shipped rung silently regresses | Re-run V1's acceptance test as a Slice 6 item |
| **A prompt that contradicts the template** ⚠️ *hit* | The rules say "use the design system", the starter demonstrates `rounded-[30px]`, and the model imitates the file | Delete the utilities **and** rewrite the `system.md` block that named them, in the same change |
| **A scale with a real hole in it** ⚠️ *hit* | Both templates independently write the same bracket value | Add the value to the scale once. A repeated bracket value is a feature request, not a violation |
| **Generated files edited by hand** | Two templates quietly stop matching; nothing errors | `bun run ui:check` plus a test comparing every emitted file to the emitter's output |
| **Filtering the tree inside `listDir`** | `list_files` hides real files from the agent that calls it | Filter in `buildSystemPrompt` only — trim what is *summarised*, never what a tool reports |
| **Stale build output in the workspace copy** ⚠️ *hit* | The dev server serves the template's prebuilt page and the preview lies about what was generated | `dist`, `.next`, `.turbo` added to the rsync excludes beside `node_modules` |
| **A template depending on generated types** ⚠️ *hit* | `tsc --noEmit` fails on a pristine Next workspace (no `.next/types`), and the agent burns a repair cycle "fixing" a file it never touched — every run | Explicit props types in the template; do not rely on `LayoutProps<"/">` |

---

## Concepts to learn here

Design tokens as a constraint system · one definition serving several jobs · why a template is a
prompt. See [CRASH_COURSE.md](../CRASH_COURSE.md#design-tokens-as-a-constraint-system).

---

## Definition of done

- [x] Two templates, one prompt, output that reads as one product.
- [x] No arbitrary bracket values in a generated diff.
- [x] The token scale is defined exactly once and imported twice.
- [x] The agent reaches for `Button` instead of writing one.
- [x] V1's acceptance test still passes.
