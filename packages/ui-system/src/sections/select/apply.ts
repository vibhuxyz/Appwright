import type { Blueprint, DesignBlock, Page, ProjectType } from "@repo/contracts";
import type { SectionEntry } from "../registry";
import { chooseAll } from "./choose";
import { purposesFor, wantsTestimonials } from "./purposes";
import type { RankContext } from "./rank";
import { repairLayouts } from "./repair";
import { assignRhythm } from "./rhythm";

function mergeLabels(components: readonly string[], labels: readonly string[]): string[] {
  const seen = new Set(components);
  const next = [...components];
  for (const label of labels) {
    if (seen.has(label)) continue;
    seen.add(label);
    next.push(label);
  }
  return next;
}

function labelsFor(entries: readonly SectionEntry[]): string[] {
  const labels: string[] = [];
  for (const entry of entries) {
    if (!entry.componentName || labels.includes(entry.componentName)) continue;
    labels.push(entry.componentName);
  }
  return labels;
}

function composePage(page: Page, design: DesignBlock, projectType: ProjectType): Page {
  const text = `${page.purpose} ${page.components.join(" ")}`;
  const context: RankContext = {
    projectType,
    style: design.style,
    density: design.density,
    allowTestimonials: wantsTestimonials(text),
    previousLayout: null,
  };
  const chosen = repairLayouts(chooseAll(purposesFor(page.route, text, projectType), context), context);
  return {
    ...page,
    components: mergeLabels(page.components, labelsFor(chosen)),
    sections: assignRhythm(chosen, design.density, design.style, projectType),
  };
}

export function applyComposition(blueprint: Blueprint, projectType: ProjectType): Blueprint {
  const resolved = blueprint.projectType && blueprint.projectType !== "other" ? blueprint.projectType : projectType;
  return {
    ...blueprint,
    projectType: resolved,
    pages: blueprint.pages.map((page) => composePage(page, blueprint.design, resolved)),
  };
}
