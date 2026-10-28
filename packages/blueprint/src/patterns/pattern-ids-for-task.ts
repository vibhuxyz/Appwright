import { experienceEffectIds, experienceSeed, patternById, planComposition, planExperience, shellFor } from "@repo/ui-system";
import type { Blueprint, DesignBlock, Page } from "@repo/contracts";
import { pageRouteOf } from "../asset-hints";
import type { TaskDetail } from "../load-task-detail";

const SECTION_ID_PATTERN = /\b[a-z]+\.[a-z]+(?:-[a-z]+)*\b/g;
const NEXT_CONFIG_PREFIX = "next.config";

function pageOf(task: TaskDetail) {
  const route = pageRouteOf(task.title);
  return task.pages.find((candidate) => candidate.route === route);
}

function pageSectionIds(page: Page | undefined): string[] {
  return (page?.sections ?? []).map((section) => section.sectionId);
}

export function effectIdsForPage(page: Page, design: DesignBlock, projectId: string): string[] {
  const plan = planComposition(page, design);
  return plan ? experienceEffectIds(planExperience(plan, { briefText: page.purpose, seed: experienceSeed({ page, design, projectId }) })) : [];
}

export function patternIdsForPage(page: Page): string[] {
  return pageSectionIds(page).filter((id) => patternById(id) !== undefined);
}

export function shellSectionIdsFor(blueprint: Pick<Blueprint, "projectType" | "pages" | "intent">): string[] {
  const shell = shellFor(blueprint);
  return [shell.announcementId, shell.navigationId, shell.footerId].flatMap((id) => (id !== null && patternById(id) !== undefined ? [id] : []));
}

export function effectIdsForTask(task: TaskDetail): string[] {
  if (task.type.toLowerCase() !== "page") return [];
  const page = pageOf(task);
  return page ? effectIdsForPage(page, task.design, task.projectId) : [];
}

function shellSectionIds(title: string): string[] {
  return [...title.matchAll(SECTION_ID_PATTERN)].map((match) => match[0]);
}

export function patternIdsForTask(task: TaskDetail): string[] {
  const type = task.type.toLowerCase();
  const candidates = type === "page" ? pageSectionIds(pageOf(task)) : type === "app-shell" ? shellSectionIds(task.title) : [];
  return candidates.filter((id) => patternById(id) !== undefined);
}

export function isNextProject(projectTree: readonly string[]): boolean {
  return projectTree.some((entry) => entry.startsWith(NEXT_CONFIG_PREFIX));
}
