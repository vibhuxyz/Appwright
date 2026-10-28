# Layout composition

Use when: a page task lists sections.

## How to compose
1. Render the listed sections in order. When a section line says "Pattern ready on disk", import that component and pass real content. Do not rewrite it.
2. Sections without a pattern: build them on a 12-column grid (`grid grid-cols-4 md:grid-cols-12 gap-x-6`) inside `mx-auto max-w-screen-2xl px-4 md:px-8`.
3. Vary the rhythm: a full-bleed section, then a contained one, then a narrow text section. Never two identical layouts in a row.
4. Vertical spacing: py-16 for compact, py-20 for comfortable, py-24 to py-40 for spacious sections.

## Pattern choice
- Editorial hero: oversized type, image offset into the grid.
- Cinematic hero: full-bleed photo, headline bottom-left, solid buttons.
- Product rail: home "new in" or "trending"; product grid: listing pages.
- Bento grid: 4 to 7 features of unequal importance.
- Sticky story: 3 to 5 steps that each have an image.
- Editorial gallery: rail for 4 to 8 projects, staggered for 4 to 12.

## Responsive
- Design mobile first: one column, then add columns at md and lg.
- Horizontal rails use `snap-x snap-mandatory overflow-x-auto` and keep their crop; they never shrink cards below 60% of the viewport on phones.
- No fixed widths in px. No element wider than the viewport.

## Anti-patterns
- Wrapping everything in Card components.
- `max-w-7xl mx-auto` on every section with the same padding.
- Absolute positioning for layout instead of grid or flex.

## Done when
- Every listed section renders with its `data-section` attribute.
- At 375px wide nothing scrolls sideways except intentional rails.
