# Visual quality review

Use when: a browser check reported problems, or you are fixing a visual defect.

## Workflow
1. Read every finding: route, viewport, type and selector.
2. Find the cause in the source, not a symptom patch. Typical causes:
   - Sideways scroll: a fixed width, `w-screen` inside padding, a long unbroken word, or a negative margin.
   - Clipped or overlapping text: fixed heights on text containers, absolute positioning, line-height below 1 with large type.
   - Broken image: wrong path or an invented URL. Use the listed asset URL or the Media placeholder.
   - Console error: fix the thrown error; do not silence it.
   - Unlabelled control: add `aria-label` to icon-only buttons and a label to inputs.
3. Fix only the files involved. Keep the section structure and `data-section` attributes.
4. Stop after the fix; the platform rechecks the same routes and viewports.

## Polish checks (fix when the source confirms them)
- Nested rounded surfaces: the outer radius is the inner radius plus the padding.
- Content photos get a 1px inset outline (`outline outline-1 -outline-offset-1 outline-black/10`, `dark:outline-white/10`); logos and illustrations do not.
- Depth comes from shadows, structure from borders: dividers, inputs and selected states keep borders.
- Scrollable menus, drawers and dialogs use `overscroll-contain`.
- Frosted bars (`backdrop-blur` with a semi-transparent background) also need a solid fallback for reduced transparency.
- Motion: no `transition-all`, no scale from 0, buttons press to `scale-96`, and every moving element has a reduced-motion path.
- Details: every link and card has an authored hover state, focus-visible rings are visible on every surface, headings use text-balance.

## Anti-patterns
- `overflow-hidden` on body or html to hide sideways scroll.
- Deleting the section that had the problem.
- Reporting a fix you did not make.

## Done when
- Each finding has a matching source change.
- Nothing else on the page changed.
