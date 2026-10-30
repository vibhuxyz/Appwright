import type { Blueprint, DesignBlock, Page, ProjectType } from "@repo/contracts";
import { detectArtDirection } from "../direction";
import { detectPlaybook } from "../playbook";
import type { ArtDirection, SectionEntry } from "../registry";
import { chooseAll } from "./choose";
import { isHome, purposesFor, wantsPlayful, wantsTestimonials } from "./purposes";
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

interface PageContext {
  design: DesignBlock;
  projectType: ProjectType;
  direction: ArtDirection;
}

function composePage(page: Page, { design, projectType, direction }: PageContext): Page {
  const text = `${page.purpose} ${page.components.join(" ")}`;
  const context: RankContext = {
    projectType,
    style: design.style,
    density: design.density,
    allowTestimonials: wantsTestimonials(text),
    allowPlayful: wantsPlayful(`${text} ${design.style}`),
    previousLayout: null,
    direction,
    playbook: detectPlaybook(page.purpose),
    isHome: isHome(page.route, text),
  };
  const chosen = repairLayouts(chooseAll(purposesFor(page.route, text, projectType, direction), context), context);
  return {
    ...page,
    artDirection: direction,
    components: mergeLabels(page.components, labelsFor(chosen)),
    sections: assignRhythm(chosen, design.density, design.style, projectType),
  };
}

export function directionFor(blueprint: Pick<Blueprint, "intent" | "pages">, projectType: ProjectType): ArtDirection {
  const text = [blueprint.intent.domain, blueprint.intent.type, ...blueprint.pages.map((page) => page.purpose)].join(" ");
  return detectArtDirection(text, projectType);
}

export function applyComposition(blueprint: Blueprint, projectType: ProjectType): Blueprint {
  const resolved = blueprint.projectType && blueprint.projectType !== "other" ? blueprint.projectType : projectType;
  const context: PageContext = { design: blueprint.design, projectType: resolved, direction: directionFor(blueprint, resolved) };
  return {
    ...blueprint,
    projectType: resolved,
    pages: blueprint.pages.map((page) => composePage(page, context)),
  };
}
