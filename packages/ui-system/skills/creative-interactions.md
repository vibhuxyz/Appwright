# Creative interactions

Use when: the experience strategy names a pointer, drag, canvas or scroll-choreography effect.

## Build the signature moment
- One signature per page, in the section the brief names. Tie it to the business: a bakery's hand-drawn line follows its own lettering, a studio's drag stage holds its real work.
- Wrap real content: Media images, the business's words. Never a demo string, a stock shape or a random photo.
- Content must read without the effect. If the effect fails, the section is still complete.

## Pointer and drag
- Listen on the element, never on window or document. Effects already do this; do not add listeners.
- Everything draggable is also movable by keyboard and labelled (DraggableCards does this; keep its label prop meaningful).
- Hover is a bonus: anything revealed on hover is also visible or reachable by tap.
- Keep drag stages away from scroll-heavy areas on phones; the patterns switch to a snap row below md.

## Canvas and ambient
- At most one continuous effect on screen. It sits behind content with pointer-events-none and aria-hidden.
- Text over it keeps 4.5:1 contrast on the plain section colour, as if the effect were off.

## Scroll choreography
- ScrollExpand adds one screen of scroll: use it once, between discovery and conversion, never in the hero.
- Never trap scroll or hide content until a scroll position is reached; Reveal and Media entrances already show content when JavaScript is off.

## Done when
- The signature works with mouse, touch and keyboard, or has the documented fallback.
- Reduced motion shows the finished state, nothing moving.
- Nothing else on the page competes with the signature moment.
