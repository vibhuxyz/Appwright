import type { DesignBlock, ProjectType, SectionPurpose } from "@repo/contracts";
import { SECTION_CATALOG } from "../catalog";
import { densityOfLayout, expressiveBudget, motionOf } from "../compose";
import type { Playbook } from "../playbook";
import { ingestionAllowed, isStackCompatible, type ArtDirection, type SectionEntry } from "../registry";

const STYLE_MATCH = 4;
const DENSITY_MATCH = 2;
const BUSINESS_MATCH = 3;
const LAYOUT_CHANGE = 3;
const LAYOUT_REPEAT = -6;
const DIRECTION_MATCH = 5;
const PLAYBOOK_MATCH = 6;
const PLACEMENT_MATCH = 2;
const DENSE_REPEAT = -3;
const DENSITY_CONTRAST = 2;
const EXPRESSIVE_REPEAT = -4;
const EXPRESSIVE_OVER_BUDGET = -8;

export interface RankContext {
  projectType: ProjectType;
  style: string;
  density: DesignBlock["density"];
  allowTestimonials: boolean;
  allowPlayful?: boolean;
  previousLayout: string | null;
  forbidId?: string;
  direction?: ArtDirection;
  playbook?: Playbook | null;
  isHome?: boolean;
  previousDensity?: string | null;
  previousMotion?: string | null;
  usedIds?: ReadonlySet<string>;
  expressiveCount?: number;
}

function fitsDirection(section: SectionEntry, direction: ArtDirection | undefined): boolean {
  if (!section.directions || section.directions.length === 0) return true;
  return direction !== undefined && section.directions.includes(direction);
}

function fitsPlaybook(section: SectionEntry, playbook: Playbook | null | undefined): boolean {
  if (!section.playbooks || section.playbooks.length === 0) return true;
  return playbook != null && section.playbooks.includes(playbook.id);
}

function isPlaybookPreferred(section: SectionEntry, playbook: Playbook | null | undefined): boolean {
  return playbook != null && playbook.sectionOrder.includes(section.id);
}

function placementScore(section: SectionEntry, isHome: boolean | undefined): number {
  if (!section.placement || isHome === undefined) return 0;
  return (section.placement === "home") === isHome ? PLACEMENT_MATCH : -PLACEMENT_MATCH;
}

export function isEligible(section: SectionEntry, context: RankContext): boolean {
  if (section.quality !== "accepted") return false;
  if (!isStackCompatible(section)) return false;
  if (!ingestionAllowed(section.sourceId)) return false;
  if (section.purpose === "testimonials" && !context.allowTestimonials) return false;
  if (context.usedIds?.has(section.id)) return false;
  if (section.characteristics.includes("playful") && !context.allowPlayful) return false;
  if (section.businesses.length > 0 && !section.businesses.includes(context.projectType)) return false;
  const isAllowedByDirection = fitsDirection(section, context.direction) || isPlaybookPreferred(section, context.playbook);
  return isAllowedByDirection && fitsPlaybook(section, context.playbook);
}

function sequenceScore(section: SectionEntry, context: RankContext): number {
  const density = densityOfLayout(section.layoutPattern);
  const isExpressive = motionOf(section) === "expressive";
  let score = 0;
  if (context.previousDensity) score += density === "high" && context.previousDensity === "high" ? DENSE_REPEAT : density !== context.previousDensity ? DENSITY_CONTRAST : 0;
  if (isExpressive && context.previousMotion === "expressive") score += EXPRESSIVE_REPEAT;
  if (isExpressive && (context.expressiveCount ?? 0) >= expressiveBudget(context.playbook)) score += EXPRESSIVE_OVER_BUDGET;
  return score;
}

export function scoreSection(section: SectionEntry, context: RankContext): number {
  let score = section.styles.includes(context.style) ? STYLE_MATCH : 0;
  if (section.densities.includes(context.density)) score += DENSITY_MATCH;
  if (section.businesses.includes(context.projectType)) score += BUSINESS_MATCH;
  if (context.direction && section.directions?.includes(context.direction)) score += DIRECTION_MATCH;
  if (isPlaybookPreferred(section, context.playbook)) score += PLAYBOOK_MATCH;
  score += placementScore(section, context.isHome);
  score += sequenceScore(section, context);
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
