import type { DesignBlock, ProjectType, SectionPurpose } from "@repo/contracts";
import { SECTION_CATALOG } from "../catalog";
import { ingestionAllowed, isStackCompatible, type SectionEntry } from "../registry";

const STYLE_MATCH = 4;
const DENSITY_MATCH = 2;
const BUSINESS_MATCH = 3;
const LAYOUT_CHANGE = 3;
const LAYOUT_REPEAT = -6;

export interface RankContext {
  projectType: ProjectType;
  style: string;
  density: DesignBlock["density"];
  allowTestimonials: boolean;
  previousLayout: string | null;
  forbidId?: string;
}

export function isEligible(section: SectionEntry, context: RankContext): boolean {
  if (section.quality !== "accepted") return false;
  if (!isStackCompatible(section)) return false;
  if (!ingestionAllowed(section.sourceId)) return false;
  if (section.purpose === "testimonials" && !context.allowTestimonials) return false;
  if (section.businesses.length > 0 && !section.businesses.includes(context.projectType)) return false;
  return true;
}

export function scoreSection(section: SectionEntry, context: RankContext): number {
  let score = section.styles.includes(context.style) ? STYLE_MATCH : 0;
  if (section.densities.includes(context.density)) score += DENSITY_MATCH;
  if (section.businesses.includes(context.projectType)) score += BUSINESS_MATCH;
  score += context.previousLayout && section.layoutPattern === context.previousLayout ? LAYOUT_REPEAT : LAYOUT_CHANGE;
  return score;
}

export function rankSections(candidates: readonly SectionEntry[], context: RankContext): SectionEntry[] {
  return [...candidates].sort((left, right) => {
    const delta = scoreSection(right, context) - scoreSection(left, context);
    if (delta !== 0) return delta;
    return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
  });
}

export function selectForPurpose(purpose: SectionPurpose, context: RankContext): SectionEntry | undefined {
  const candidates = SECTION_CATALOG.filter(
    (section) => section.purpose === purpose && section.id !== context.forbidId && isEligible(section, context),
  );
  return rankSections(candidates, context)[0];
}
