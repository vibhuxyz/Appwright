import type { DesignBlock, Page } from "@repo/contracts";
import { sectionById } from "../catalog";
import type { SectionEntry } from "../registry";
import { CONVERSION_PURPOSES, DENSITY_BY_DESIGN, IMAGE_TREATMENT, MAX_GOAL_CHARS, TYPOGRAPHY_STYLE } from "./constants";
import { compositionConstraints } from "./constraints";
import { directionOfSections } from "./direction";
import { densityOfLayout, motionOf, strongestMotion } from "./traits";
import type { ComposedSection, PageCompositionPlan, VisualRole } from "./types";

function flat(text: string): string {
  const single = text.replace(/\s+/g, " ").trim();
  return single.length <= MAX_GOAL_CHARS ? single : `${single.slice(0, MAX_GOAL_CHARS - 1).trimEnd()}…`;
}

function roleFor(entry: SectionEntry, index: number, hasHero: boolean): VisualRole {
  if (entry.purpose === "hero" || (!hasHero && index === 0)) return "anchor";
  return CONVERSION_PURPOSES.has(entry.purpose) ? "conversion" : "support";
}

export function planComposition(page: Page, design: DesignBlock): PageCompositionPlan | null {
  const entries = (page.sections ?? []).flatMap((section) => sectionById(section.sectionId) ?? []);
  if (entries.length === 0) return null;
  const hasHero = entries.some((entry) => entry.purpose === "hero");
  const sections: ComposedSection[] = entries.map((entry, index) => ({
    sectionId: entry.id,
    patternId: entry.patternId ?? null,
    purpose: entry.purpose,
    visualRole: roleFor(entry, index, hasHero),
    density: densityOfLayout(entry.layoutPattern),
  }));
  const motions = entries.map(motionOf);
  const artDirection = page.artDirection ?? directionOfSections(entries, page.purpose);
  const visualStrategy = {
    density: DENSITY_BY_DESIGN[design.density],
    imageTreatment: IMAGE_TREATMENT[artDirection],
    typographyStyle: TYPOGRAPHY_STYLE[artDirection],
    motionLevel: strongestMotion(motions),
  } as const;
  return {
    artDirection,
    pageGoal: flat(page.purpose),
    visualStrategy,
    sections,
    constraints: compositionConstraints(sections, motions, visualStrategy),
  };
}
