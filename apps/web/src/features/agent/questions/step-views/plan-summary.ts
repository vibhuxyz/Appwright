import type { PlanPage, PlanPreview } from "@repo/contracts";
import { friendlySectionLabel, isTechnicalSection, pageTitle } from "./plan-labels";

export interface PlanSectionSummary {
  label: string;
  hasImage: boolean;
}

export interface PlanPageSummary {
  route: string;
  title: string;
  purpose: string;
  sections: readonly PlanSectionSummary[];
  imageCount: number;
}

export interface PlanOverview {
  pages: readonly PlanPageSummary[];
  sectionCount: number;
  imageCount: number;
}

export function humanizeSectionName(name: string): string {
  const words = name
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return words.length > 0 ? `${words.charAt(0).toUpperCase()}${words.slice(1)}` : name;
}

function pageSections(page: PlanPage): PlanSectionSummary[] {
  const byLabel = new Map<string, PlanSectionSummary>();
  for (const section of page.sections) {
    const label = friendlySectionLabel(humanizeSectionName(section.name));
    if (isTechnicalSection(label)) continue;
    const key = label.toLowerCase();
    const existing = byLabel.get(key);
    byLabel.set(key, { label: existing?.label ?? label, hasImage: Boolean(existing?.hasImage || section.image) });
  }
  return [...byLabel.values()];
}

export function summarizePlan(plan: PlanPreview): PlanOverview {
  const pages = plan.pages.map((page): PlanPageSummary => {
    const sections = pageSections(page);
    return { route: page.route, title: pageTitle(page.route), purpose: page.purpose, sections, imageCount: sections.filter((section) => section.hasImage).length };
  });
  return {
    pages,
    sectionCount: pages.reduce((total, page) => total + page.sections.length, 0),
    imageCount: pages.reduce((total, page) => total + page.imageCount, 0),
  };
}

export function countLabel(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}
