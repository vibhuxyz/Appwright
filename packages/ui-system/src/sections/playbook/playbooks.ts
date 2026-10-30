import type { Playbook, PlaybookId } from "./types";

export const PLAYBOOKS = {
  commerce: {
    id: "commerce",
    examples: "Puma, Wonder, Zepto",
    hero: "Utility first: full-bleed product or campaign image with one clear action; no cinematic scroll scene.",
    heroSectionIds: ["hero.cinematic", "commerce.campaign-banner"],
    sectionOrder: ["commerce.product-rail", "commerce.featured-collection", "commerce.campaign-banner", "commerce.product-grid", "categories.scroller"],
    imageRules: [
      "Products are 1:1 on a light grey ground with one ratio per row.",
      "Banners are 16:9 or 21:9; collection tiles are 4:5.",
      "Text on an image sits directly on it, uppercase and short, with no box behind it.",
    ],
    motion: { isSmoothScrollOn: false, maxPinnedScenes: 0 },
    typography: { displayMinPx: 32, trackingEm: -0.01 },
    backgrounds: "Stay white or light grey; the product colour carries the page.",
  },
  hospitality: {
    id: "hospitality",
    examples: "The Leela, Belgrade Arbor",
    hero: "Cinematic full-bleed photo or video with centred or bottom-left text and the booking or enquiry action over it.",
    heroSectionIds: ["hero.cinematic"],
    sectionOrder: ["statement.manifesto", "brand.intro", "gallery.editorial", "location.panel", "story.sticky-scroll"],
    imageRules: [
      "Images are 16:9 or wider, at least viewport height for the hero.",
      "Section titles may sit over a photo in large type with no scrim box.",
      "Show the real place or rooms; never generic stock.",
    ],
    motion: { isSmoothScrollOn: true, maxPinnedScenes: 1 },
    typography: { displayMinPx: 96, trackingEm: -0.02 },
    backgrounds: "Shift the background colour between sections (cream, deep green, navy) instead of using borders or cards.",
  },
  agency: {
    id: "agency",
    examples: "MDS Collective",
    hero: "Type-led: one oversized serif or grotesk headline with a single italic emphasis line, or a muted full-screen video.",
    heroSectionIds: ["hero.editorial"],
    sectionOrder: ["statement.manifesto", "portfolio.index-list", "story.case-study", "proof.quote-band", "stats.band"],
    imageRules: [
      "Editorial 4:5 portraits and 3:2 case images with minimal chrome and no shadows.",
      "Quotes and proof stay text-only; no avatars.",
    ],
    motion: { isSmoothScrollOn: true, maxPinnedScenes: 1 },
    typography: { displayMinPx: 120, trackingEm: -0.025 },
    backgrounds: "Mostly white with one warm neutral band; hairline rules for lists.",
  },
  studio: {
    id: "studio",
    examples: "BCG Building Design",
    hero: "Full-bleed photo of the actual work with one line of promise at the bottom-left and a giant wordmark later.",
    heroSectionIds: ["hero.cinematic", "hero.editorial"],
    sectionOrder: ["statement.manifesto", "portfolio.index-list", "portfolio.editorial", "gallery.editorial", "story.sticky-scroll"],
    imageRules: [
      "Full-bleed or half-screen images of the work, one image per idea.",
      "Warm neutral palette; no overlays on the work itself.",
    ],
    motion: { isSmoothScrollOn: true, maxPinnedScenes: 1 },
    typography: { displayMinPx: 120, trackingEm: -0.02 },
    backgrounds: "Warm beige and one dark brown or charcoal band; background shifts mark sections.",
  },
} as const satisfies Readonly<Record<PlaybookId, Playbook>>;
