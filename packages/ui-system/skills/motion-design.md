# Motion design

Use when: the page uses a pattern with motion, or the user asked for animation.

## 1. Gate first: should it move?
- Used 100+ times a day (keyboard actions, tab switches): no animation.
- Used often (hover, list navigation): under 150ms on opacity or colour, or nothing.
- Occasional (menus, drawers, toasts): standard motion.
- Rare (hero on first load, success, empty state): the one place for a designed moment.
Name the purpose (feedback, where-it-came-from, state change, avoid a jump, explain, delight). No purpose, no animation. Plan one focal moment per page; every other motion is quiet.

## 2. Use what is on disk
- `@/components/patterns/shared/motion`: `EASE_OUT`, `EASE_IN_OUT`, `DURATION_S`, `STAGGER_S`, `REVEAL_OFFSET_PX`. Never write a new cubic-bezier or duration.
- `Reveal` (fade-up on scroll), `MaskedText` (words rise through a mask; headlines only, never paragraphs or text with links).
- Effects: only the ones the experience strategy names; the brief gives each import, options and fallback. Do not install motion, lenis, three or ogl.
- Levels per section come from the brief: reveal (Reveal or a Media entrance), choreography (one pinned or scroll-linked scene), interactive (pointer, drag, canvas). "none" means the pattern as delivered.
- Cheapest tool: CSS/Tailwind transition for hover, press and toggles; framer-motion only for scroll, exit and sequenced motion.

## 3. Values
- Animate transform and opacity (clip-path is fine for reveals). Never width, height, top, left, margin or padding. Never `transition-all`; Tailwind `transition` or `transition-transform` name their properties.
- Never start from scale 0: use 0.95 plus opacity 0.
- Enter and exit: ease-out. Moving on screen: ease-in-out. Marquee: linear. Never ease-in.
- Nothing runs longer than 1.2s without a reason; the hero image settle is the longest.
- Press feedback 100–160ms; tooltips 125–200ms; menus 150–250ms; drawers and overlays 200–500ms. Exits are shorter and smaller than entrances (about 150ms, 12px).
- Stagger 30–80ms per item, about 100ms per chunk (title, text, actions), at most 6 items.
- Press: `transition duration-150 ease-out motion-safe:active:scale-96` on buttons and icon buttons.
- Springs only for drag or throw: bounce 0 by default, 0.1–0.3 only after a flick.
- Blur at most 8px while animating, only for short one-off effects, never on large surfaces; 4px is enough for a cross-fade. Modal backdrops are solid, not blurred.
- Do not animate through React state each frame; use motion values or refs.
- Never drive motion from scroll events or `scrollY`; use framer `useScroll`/`useInView`. Read layout once, then animate with transform.
- Loops (marquee, light beams, rotating words) stop when off screen (`useInView`) and when paused.

## 4. Reduced motion is tiers, not off
- Remove: parallax, large slides, big zooms, spins, auto-playing marquees and carousels, scroll hijacking.
- Soften: small slides and pop-ins become opacity fades of 150ms or less.
- Keep: opacity, colour, focus rings, loading indicators.
- Anything that moves for more than 5 seconds needs a visible pause control (WCAG 2.2.2), even with motion allowed.
- Hover-only motion relies on Tailwind 4 `hover:`, which only applies on devices that can hover.

## 5. Type in motion
Large headings take negative tracking (`tracking-tight`), body stays at normal tracking, and labels use `text-xs uppercase tracking-widest`. Tight leading on display type (`leading-none`), comfortable leading on body text.

## Anti-patterns
Every section fading up on scroll; bounce on menus; motion as the only sign that something changed; an infinite animation behind body text; content that stays hidden if a script fails.

## Done when
Each animation has a named purpose, uses the shared tokens, has a reduced-motion path, and the page reads fully with motion off.
