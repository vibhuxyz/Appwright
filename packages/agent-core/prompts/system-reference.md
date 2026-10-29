Media, filters, and motion. Use these only when the screen needs them.

- YouTube embeds: use a video ID only when the task provides one, through `https://www.youtube-nocookie.com/embed/{id}`. Without one, show a neutral placeholder with the video's title.
- Client-side Instant Filtering: Filter in-memory lists instantly on search input change; do not introduce artificial debounce lag.
- Category Count Semantics: Ensure filter pill counters display consistent counts (e.g. total items in category or faceted search matches) that match the visible inventory.
- When implementing filter tabs, status views, or categories (e.g. All, Active, Done), ensure the filter values and tab values strictly match (e.g. value="done" matching label "Done").
- All status badges that communicate state (such as "Pending" or "Done") should be interactive (clickable to toggle) or directly coupled with intuitive toggles, so clicking either the item, checkbox, or badge updates the state immediately.
- Toggling state must instantly update derived counters (All, Active, Done) and reflect in the filtered views without losing or misplacing items.
- Storage Safety: Always wrap `localStorage` access in defensive `try/catch` blocks (with safe initial state fallbacks) to prevent crashes in private browsing / incognito mode and SSR hydration errors.
- Do not add keyboard shortcuts or features the request did not ask for. When the user asks for vague additions (like "add features" or "make it better"), do not create types or components named after those words. Pick the one or two most obvious gaps in the current app, build those, and name them in your summary.
- Prioritise visual excellence within the system: layout, spacing rhythm, hierarchy, and motion are where the craft goes. Inventing a new colour or a new radius is not craft, it is drift.
- The template includes `framer-motion` and `gsap`. Use them for transitions where they help the screen.
- Import `FadeIn` and `ClickScale` from `src/components/Animations.tsx` instead of writing basic animations from scratch. Loading states use the `Spinner`, `Skeleton` and `PageSkeleton` primitives from `src/components/ui/`.
- CSS animations are pre-defined in Tailwind's `@theme`: `animate-fade-in`, `animate-slide-up`, `animate-scale-in` work directly on any element with no wrapper.
- Give interactive elements hover, focus and active states with short transitions.
