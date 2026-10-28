# Visual assets

Use when: the page needs images.

## Rules
- Use only the image URLs listed under "Images this page needs". Never invent a URL or hot-link a random photo.
- Use the `Media` component from `@/components/patterns/shared/media` with the ratio named in the section line. It handles lazy loading, `fetchPriority` for the hero and a placeholder when the image is missing.
- One crop ratio per group: every card in a grid or rail uses the same ratio.
- Hero: 16:9 or full-bleed `fill`. Product cards: 3:4. Portraits and projects: 4:5. Categories: 1:1.
- Text over a photo always sits on a scrim (`bg-linear-to-t from-black/70`) with white text.
- Alt text describes the subject in under 12 words; decorative images use empty alt only when another element carries the meaning.

## Anti-patterns
- Unrelated stock photos to fill space.
- The same image reused in hero and story.
- Images stretched with `object-fill` or without a ratio.

## Done when
- Every image has a ratio, alt text and lazy loading below the fold.
- Missing images show a placeholder with the alt text, not a broken icon.
