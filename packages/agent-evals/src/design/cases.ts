import type { ThemeFontName, ThemePalette } from "@repo/contracts";
import type { InteractionCheckId } from "./interaction-types";

export interface DesignCase {
  readonly id: string;
  readonly title: string;
  readonly route: string;
  readonly exampleFile: string;
  readonly exportName: string;
  readonly expectedSections: readonly string[];
  readonly interactions: readonly InteractionCheckId[];
  readonly fonts: { readonly heading: ThemeFontName; readonly body: ThemeFontName };
  readonly palette: ThemePalette;
}

const LIGHT_NEUTRALS = {
  background: "#ffffff",
  foreground: "#111111",
  card: "#ffffff",
  secondary: "#f4f4f5",
  secondaryForeground: "#111111",
  muted: "#f4f4f5",
  mutedForeground: "#52525b",
  border: "#e4e4e7",
} as const;

const BASE_CHECKS: readonly InteractionCheckId[] = ["content-after-scroll", "mobile-tap-targets"];

export const DESIGN_CASES: readonly DesignCase[] = [
  {
    id: "editorial-portfolio",
    title: "Premium editorial portfolio",
    route: "/showcase/portfolio",
    exampleFile: "portfolio-home.tsx",
    exportName: "PortfolioHome",
    interactions: BASE_CHECKS,
    expectedSections: ["nav.overlay-menu", "hero.editorial", "gallery.editorial", "statement.manifesto", "story.split-image", "footer.editorial"],
    fonts: { heading: "Space Grotesk", body: "Inter" },
    palette: {
      background: "#2a2925",
      foreground: "#ece8df",
      card: "#33322d",
      primary: "#ece8df",
      primaryForeground: "#2a2925",
      secondary: "#3a3933",
      secondaryForeground: "#ece8df",
      accent: "#c9b99a",
      accentForeground: "#2a2925",
      muted: "#33322d",
      mutedForeground: "#a8a399",
      border: "#4a4842",
    },
  },
  {
    id: "fashion-storefront",
    title: "Fashion ecommerce storefront",
    route: "/showcase/fashion",
    exampleFile: "fashion-home.tsx",
    exportName: "FashionHome",
    interactions: BASE_CHECKS,
    expectedSections: ["promo.bar", "hero.cinematic", "commerce.product-rail", "band.marquee", "story.sticky-scroll", "commerce.product-grid", "footer.editorial"],
    fonts: { heading: "Oswald", body: "Inter" },
    palette: { ...LIGHT_NEUTRALS, primary: "#d6001c", primaryForeground: "#ffffff", accent: "#111111", accentForeground: "#ffffff" },
  },
  {
    id: "saas-landing",
    title: "Modern SaaS landing page",
    route: "/showcase/saas",
    exampleFile: "saas-home.tsx",
    exportName: "SaasHome",
    interactions: BASE_CHECKS,
    expectedSections: ["hero.spotlight", "features.bento", "story.sticky-scroll", "statement.manifesto"],
    fonts: { heading: "Plus Jakarta Sans", body: "Inter" },
    palette: {
      background: "#0b0d12",
      foreground: "#f4f5f7",
      card: "#12151c",
      primary: "#7c8cff",
      primaryForeground: "#0b0d12",
      secondary: "#1a1e27",
      secondaryForeground: "#f4f5f7",
      accent: "#38e1b0",
      accentForeground: "#0b0d12",
      muted: "#151922",
      mutedForeground: "#9aa3b2",
      border: "#252a35",
    },
  },
  {
    id: "content-business",
    title: "Content-heavy business website",
    route: "/showcase/business",
    exampleFile: "business-home.tsx",
    exportName: "BusinessHome",
    interactions: BASE_CHECKS,
    expectedSections: ["hero.editorial", "features.bento", "story.sticky-scroll", "story.split-image", "footer.editorial"],
    fonts: { heading: "Libre Baskerville", body: "Work Sans" },
    palette: { ...LIGHT_NEUTRALS, background: "#fbfaf7", primary: "#1f3a5f", primaryForeground: "#ffffff", accent: "#b08d57", accentForeground: "#111111" },
  },
  {
    id: "local-business",
    title: "Mobile-first local business",
    route: "/showcase/local",
    exampleFile: "local-home.tsx",
    exportName: "LocalHome",
    interactions: BASE_CHECKS,
    expectedSections: ["hero.cinematic", "story.split-image", "features.bento", "footer.editorial"],
    fonts: { heading: "Fraunces", body: "DM Sans" },
    palette: { ...LIGHT_NEUTRALS, background: "#fffaf3", card: "#fffdf8", primary: "#9a3412", primaryForeground: "#ffffff", accent: "#f59e0b", accentForeground: "#111111" },
  },
  {
    id: "creative-studio",
    title: "Playful studio with drag stage, collage and case study",
    route: "/showcase/studio",
    exampleFile: "studio-home.tsx",
    exportName: "StudioHome",
    interactions: [...BASE_CHECKS, "drag-card"],
    expectedSections: ["hero.playground", "gallery.collage", "story.case-study", "proof.quote-band", "cta.band", "footer.editorial"],
    fonts: { heading: "Space Grotesk", body: "DM Sans" },
    palette: { ...LIGHT_NEUTRALS, background: "#f3efe7", card: "#fbf8f2", muted: "#e9e3d8", primary: "#1d4ed8", primaryForeground: "#ffffff", accent: "#f97316", accentForeground: "#111111" },
  },
  {
    id: "campaign-commerce",
    title: "Cinematic commerce campaign with pinned story",
    route: "/showcase/campaign",
    exampleFile: "campaign-home.tsx",
    exportName: "CampaignHome",
    interactions: BASE_CHECKS,
    expectedSections: ["promo.bar", "hero.cinematic", "commerce.product-rail", "commerce.featured-collection", "commerce.campaign-banner", "faq.stack", "footer.editorial"],
    fonts: { heading: "Oswald", body: "Inter" },
    palette: { ...LIGHT_NEUTRALS, primary: "#166534", primaryForeground: "#ffffff", accent: "#111111", accentForeground: "#ffffff" },
  },
  {
    id: "product-lab",
    title: "Interactive SaaS page with canvas, compare and pointer effects",
    route: "/showcase/lab",
    exampleFile: "product-lab.tsx",
    exportName: "ProductLab",
    interactions: [...BASE_CHECKS, "image-compare-keyboard", "image-compare-labels", "canvas-reduced-motion"],
    expectedSections: ["hero.particles", "features.glow", "compare.before-after", "stats.band", "faq.stack", "cta.band"],
    fonts: { heading: "Plus Jakarta Sans", body: "Inter" },
    palette: {
      background: "#0b0d12",
      foreground: "#f4f5f7",
      card: "#12151c",
      primary: "#38e1b0",
      primaryForeground: "#0b0d12",
      secondary: "#1a1e27",
      secondaryForeground: "#f4f5f7",
      accent: "#7c8cff",
      accentForeground: "#0b0d12",
      muted: "#151922",
      mutedForeground: "#9aa3b2",
      border: "#252a35",
    },
  },
];
