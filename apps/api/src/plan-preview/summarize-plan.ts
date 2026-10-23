import {
  PLAN_PREVIEW_LIMITS,
  PLAN_SUMMARY_LIMITS,
  type AssetPurpose,
  type AssetSlot,
  type Blueprint,
  type PlanPage,
  type PlanPreview,
  type PlanSection,
} from "@repo/contracts";

function clip(text: string, maxChars: number): string {
  return text.replace(/\s+/g, " ").trim().slice(0, maxChars);
}

function sectionName(componentName: string): string {
  const spaced = componentName.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[-_]+/g, " ");
  return clip(spaced, PLAN_SUMMARY_LIMITS.maxNameChars);
}

function imagesByComponent(slots: readonly AssetSlot[], route: string): Map<string, AssetPurpose> {
  return new Map(
    slots.filter((slot) => slot.pageRoute === route).map((slot) => [slot.componentName, slot.purpose]),
  );
}

function sectionsFor(components: readonly string[], images: ReadonlyMap<string, AssetPurpose>): PlanSection[] {
  const names = [...new Set([...images.keys(), ...components])];
  return names.slice(0, PLAN_SUMMARY_LIMITS.maxSectionsPerPage).map((name) => {
    const image = images.get(name);
    return image ? { name: sectionName(name), image } : { name: sectionName(name) };
  });
}

function pageSummary(page: Blueprint["pages"][number], slots: readonly AssetSlot[]): PlanPage {
  return {
    route: clip(page.route, PLAN_SUMMARY_LIMITS.maxNameChars),
    purpose: clip(page.purpose, PLAN_SUMMARY_LIMITS.maxPurposeChars),
    sections: sectionsFor(page.components, imagesByComponent(slots, page.route)),
  };
}

export function summarizePlan(
  blueprintId: string,
  blueprint: Blueprint,
  slots: readonly AssetSlot[],
): PlanPreview {
  return {
    blueprintId,
    pages: blueprint.pages.slice(0, PLAN_SUMMARY_LIMITS.maxPages).map((page) => pageSummary(page, slots)),
    features: blueprint.features
      .slice(0, PLAN_SUMMARY_LIMITS.maxFeatures)
      .map((feature) => clip(feature, PLAN_SUMMARY_LIMITS.maxNameChars)),
    entities: blueprint.entities
      .slice(0, PLAN_PREVIEW_LIMITS.maxEntities)
      .map((entity) => clip(entity.name, PLAN_SUMMARY_LIMITS.maxNameChars)),
  };
}
