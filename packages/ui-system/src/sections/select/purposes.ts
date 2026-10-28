import type { ProjectType, SectionPurpose } from "@repo/contracts";
import type { ArtDirection } from "../registry";

const MAX_PURPOSES = 8;
const PRIVATE_ROUTE = /^\/(admin|dashboard|account|settings)(\/|$)/;

const HOME: Record<ProjectType, readonly SectionPurpose[]> = {
  "business-site": ["hero", "brand", "features", "gallery", "location", "contact", "cta"],
  portfolio: ["hero", "portfolio", "gallery", "story", "contact"],
  saas: ["hero", "features", "product-showcase", "faq", "cta"],
  marketplace: ["hero", "categories", "product-showcase", "cta"],
  wallet: ["hero", "features", "faq", "cta"],
  other: ["hero", "features", "cta"],
};

const DIRECTION_HOME: Partial<Record<ArtDirection, readonly SectionPurpose[]>> = {
  commerce: ["hero", "categories", "product-showcase", "brand", "story", "cta"],
  editorial: ["hero", "brand", "gallery", "portfolio", "story", "contact"],
  product: ["hero", "features", "story", "product-showcase", "faq", "cta"],
};

function homePurposes(projectType: ProjectType, direction: ArtDirection | undefined): readonly SectionPurpose[] {
  const directed = direction ? DIRECTION_HOME[direction] : undefined;
  return directed ?? HOME[projectType];
}

export function wantsPlayful(text: string): boolean {
  return /\b(playful|interactive|experimental|playground|drag\w*|creative studio)\b/i.test(text);
}

export function wantsTestimonials(text: string): boolean {
  return /\b(testimonial|reviews|social proof)\b/i.test(text);
}

function insertBeforeCta(purposes: SectionPurpose[], purpose: SectionPurpose): void {
  if (purposes.includes(purpose)) return;
  const ctaAt = purposes.indexOf("cta");
  if (ctaAt === -1) purposes.push(purpose);
  else purposes.splice(ctaAt, 0, purpose);
}

function withSignals(base: readonly SectionPurpose[], text: string): SectionPurpose[] {
  const purposes = [...base];
  if (/\b(pric\w*|plans?|tiers?|subscription)\b/i.test(text)) insertBeforeCta(purposes, "pricing");
  if (/\b(faq|questions)\b/i.test(text)) insertBeforeCta(purposes, "faq");
  if (/\b(newsletter|subscribe)\b/i.test(text)) insertBeforeCta(purposes, "newsletter");
  if (/\b(menu|catalog|shop|products?)\b/i.test(text)) insertBeforeCta(purposes, "categories");
  if (wantsTestimonials(text)) insertBeforeCta(purposes, "testimonials");
  return purposes.slice(0, MAX_PURPOSES);
}

function privatePurposes(text: string): SectionPurpose[] {
  if (/\b(login|sign in|sign-in)\b/i.test(text)) return ["form"];
  if (/\b(settings|hours|media|upload)\b/i.test(text)) return ["form"];
  if (/\b(table|records|edit|search|list)\b/i.test(text)) return ["data-table"];
  return ["dashboard-metrics"];
}

function publicPurposes(text: string, projectType: ProjectType): SectionPurpose[] {
  if (/\b(dashboard|metrics|analytics)\b/i.test(text)) return ["dashboard-metrics", "data-table"];
  if (/\bcontact\b/i.test(text)) return projectType === "business-site" ? ["contact", "location"] : ["contact", "form"];
  if (/\b(gallery|portfolio|our work)\b/i.test(text)) {
    return projectType === "portfolio" ? ["portfolio", "gallery", "cta"] : ["gallery", "cta"];
  }
  if (/\b(about|story|brand)\b/i.test(text)) return ["brand", "cta"];
  if (/\b(pric\w*|faq|questions)\b/i.test(text)) return withSignals(["pricing", "faq", "cta"], text);
  if (/\b(menu|catalog|shop|product)\b/i.test(text)) return ["categories", "product-showcase"];
  if (/\b(form|book|quote|signup)\b/i.test(text)) return ["form"];
  return ["features", "cta"];
}

export function isHome(route: string, text: string): boolean {
  const root = route === "/" || route.endsWith("/home");
  return root && !/\b(dashboard|admin|sign in|login)\b/i.test(text);
}

export function purposesFor(
  route: string,
  text: string,
  projectType: ProjectType,
  direction?: ArtDirection,
): SectionPurpose[] {
  if (PRIVATE_ROUTE.test(route)) return privatePurposes(text);
  if (isHome(route, text)) return withSignals(homePurposes(projectType, direction), text);
  if (/\b(table|records|list)\b/i.test(text)) return ["data-table"];
  return publicPurposes(text, projectType).slice(0, MAX_PURPOSES);
}
