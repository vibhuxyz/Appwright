# Art direction

Use when: you build or restyle a public page.

Decide the look before writing JSX. The design system block above already fixes colours and fonts; your job is how they are used.

## Concept first
Before any JSX, write three lines for yourself: brand essence (one word), visual tension (two opposing forces, e.g. raw clay vs. precise grid), and the signature moment the brief names. Every section serves those three lines.

## Choose by business
- Fashion, sport, retail: big campaign photography, uppercase condensed headings, solid square buttons, white space between rails. Reference feel: Puma, Nike, Myntra.
- Portfolio, studio, photographer: quiet background, small uppercase labels (text-xs tracking-widest), very large headline, images do the talking, almost no cards or shadows.
- SaaS, developer tool: dark or very light canvas, one accent colour, centred headline, product screenshots in bento cards.
- Local business (cafe, salon, clinic): warm real photos of the place, opening hours and address visible early, friendly sentence-case headings.

## Rules
- One typographic scale per page: headline, section title, body, label. Labels are text-xs uppercase tracking-widest.
- Scale contrast: the hero headline is at least ten times the body size on desktop (text-7xl to text-9xl against text-base); 3 to 7 words; tracking-tight or tracking-tighter, leading-none; text-balance on every heading.
- Body text: text-base or text-lg, leading-relaxed, max-w-prose (45 to 75 characters).
- Blur test: squint at the page; if the hierarchy disappears, increase size contrast or space, not colour.
- Contrast comes from size and space, not from more colours. Use primary for one action per screen.
- Alternate surfaces (bg-background, bg-muted, inverse bg-foreground text-background) so sections read as chapters.
- The accent (primary) appears on actions, links and one detail per screen, never as a background wash.
- Every image is the business's own subject. If you do not have it, render the Media placeholder with real alt text.

## Delight, earned
Write one sentence on what the visitor should feel and why it belongs to this business. Spend it on one moment that matters, such as the hero, a booking or order success, or an empty state, and make it specific enough that a neighbouring business could not reuse it. Keep routine clicks plain and certain. Never delay the task, fake progress, or joke about money, privacy or errors.

## Anti-patterns
- Three equal cards with an icon, title and two lines, repeated on every page.
- Gradient text, glassmorphism and glow on a fashion or local-business site.
- Centred everything. Use the grid: offset intros, images that break columns.
- Inventing prices, reviews, client logos or statistics.
- The purple-to-blue "AI gradient" hero, emoji in the interface, lorem ipsum.
- Smooth-scroll libraries or anything that takes over the scroll.

## Done when
- The three concept lines are visible in the page: someone could guess the brand essence from a screenshot.
- The page has one clear focal point above the fold.
- Labels, headings and body follow one scale.
- No section looks like a default template card grid unless the plan asked for it.
