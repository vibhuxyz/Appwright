import type { PatternEntry } from "../types";

export const PRODUCT_CARD = "commerce/product-card.tsx";

export const CORE_PATTERNS: readonly PatternEntry[] = [
  {
    id: "hero.editorial",
    file: "hero/editorial-hero.tsx",
    exportName: "EditorialHero",
    requires: [],
    effects: ["blur-text"],
    motion: "expressive",
    usage:
      "Oversized headline across most of the grid, a short intro offset to one side, one image breaking the grid. Portfolios, studios, magazines, premium brands.",
    antiPatterns: [
      "More than two calls to action",
      "Centring the headline",
      "A stock photo unrelated to the work",
    ],
  },
  {
    id: "hero.cinematic",
    file: "hero/cinematic-hero.tsx",
    exportName: "CinematicHero",
    requires: [],
    effects: ["magnet"],
    motion: "subtle",
    usage:
      "Full-bleed photo or campaign image, short uppercase headline bottom-left, up to three solid actions. Fashion, sport, hospitality, product launches.",
    antiPatterns: [
      "Text over a busy part of the image without the scrim",
      "Paragraphs of copy in the hero",
      "Using it without a real campaign image",
    ],
  },
  {
    id: "hero.spotlight",
    file: "hero/spotlight-hero.tsx",
    exportName: "SpotlightHero",
    requires: [],
    effects: ["spotlight", "rotating-text"],
    motion: "expressive",
    usage:
      "Dark centred product headline with one rotating word and moving light. SaaS, developer tools, AI products.",
    antiPatterns: [
      "Light colour mode",
      "More than four rotating words",
      "Fashion or local-business sites",
    ],
  },
  {
    id: "promo.bar",
    file: "commerce/promo-bar.tsx",
    exportName: "PromoBar",
    requires: [],
    effects: [],
    motion: "none",
    usage:
      "One-line announcement strip above the navigation: offer, shipping, launch.",
    antiPatterns: ["Invented discounts", "More than one message"],
  },
  {
    id: "commerce.product-grid",
    file: "commerce/product-grid.tsx",
    exportName: "ProductGrid",
    requires: [PRODUCT_CARD],
    effects: [],
    motion: "subtle",
    usage:
      "Product cards in 2/3/4 columns with brand, name, price, compare-at price, discount label, rating and wishlist. Listing and category pages.",
    antiPatterns: [
      "Invented products or prices",
      "Mixed image ratios inside one grid",
      "Prices as numbers formatted in the component",
    ],
  },
  {
    id: "commerce.product-rail",
    file: "commerce/product-rail.tsx",
    exportName: "ProductRail",
    requires: [PRODUCT_CARD, "commerce/rail-progress.tsx"],
    effects: [],
    motion: "subtle",
    usage:
      "A horizontal, snap-scrolling row of product cards with previous/next buttons and a thin progress bar under the row. Home page 'trending' or 'new in'.",
    antiPatterns: [
      "Auto-scrolling",
      "Hiding the scroll affordance on touch",
      "More than 12 products",
    ],
  },
  {
    id: "gallery.editorial",
    file: "editorial/editorial-gallery.tsx",
    exportName: "EditorialGallery",
    requires: [],
    effects: [],
    motion: "subtle",
    usage:
      "Project images with small uppercase captions: a horizontal rail, or a staggered grid with mixed ratios that drift on scroll. Portfolios, agencies, photographers.",
    antiPatterns: [
      "Equal cards with drop shadows",
      "Captions longer than one line",
    ],
  },
  {
    id: "story.sticky-scroll",
    file: "editorial/sticky-story.tsx",
    exportName: "StickyStory",
    requires: [],
    effects: [],
    motion: "expressive",
    usage:
      "A pinned image panel that changes as numbered steps scroll past. Product stories, collections, processes.",
    antiPatterns: [
      "Fewer than three steps",
      "Long body text per step",
      "Pinning on mobile",
    ],
  },
  {
    id: "story.split-image",
    file: "editorial/split-story.tsx",
    exportName: "SplitStory",
    requires: [],
    effects: ["count-up"],
    motion: "subtle",
    usage:
      "Text beside one large image that drifts slightly on scroll, with optional real stats. About, brand story, service detail.",
    antiPatterns: [
      "Invented numbers in the stats",
      "Two split sections in a row with the same side",
    ],
  },
  {
    id: "statement.manifesto",
    file: "editorial/manifesto.tsx",
    exportName: "Manifesto",
    requires: [],
    effects: ["scroll-reveal"],
    motion: "expressive",
    usage:
      "One large paragraph whose words light up while scrolling. Brand belief, studio statement.",
    antiPatterns: ["More than 60 words", "Two manifestos on one page"],
  },
  {
    id: "band.marquee",
    file: "editorial/marquee-band.tsx",
    exportName: "MarqueeBand",
    requires: [],
    effects: ["scroll-velocity"],
    motion: "expressive",
    usage:
      "Huge outlined or solid words scrolling sideways between sections: collections, services, client names.",
    antiPatterns: [
      "More than one per page",
      "Sentences instead of short words",
    ],
  },
  {
    id: "features.bento",
    file: "layout/bento-grid.tsx",
    exportName: "BentoGrid",
    requires: [],
    effects: [],
    motion: "subtle",
    usage:
      "Features or services in cards of unequal size (large, wide, tall, small). SaaS features, agency services.",
    antiPatterns: [
      "All cards the same size",
      "More than seven cards",
      "An icon on every card and no images",
    ],
  },
  {
    id: "nav.overlay-menu",
    file: "layout/overlay-nav.tsx",
    exportName: "OverlayNav",
    requires: [],
    effects: [],
    motion: "subtle",
    usage:
      "Minimal top bar (brand, menu, contact) that opens a full-screen menu with large links. Portfolios, studios, fashion.",
    antiPatterns: [
      "Hiding the only call to action inside the menu",
      "Commerce sites that need visible categories",
    ],
  },
  {
    id: "footer.editorial",
    file: "layout/editorial-footer.tsx",
    exportName: "EditorialFooter",
    requires: [],
    effects: [],
    motion: "none",
    usage:
      "Short statement, link columns, and the brand name set very large at the bottom.",
    antiPatterns: ["Social icons with no links", "More than four columns"],
  },
];
