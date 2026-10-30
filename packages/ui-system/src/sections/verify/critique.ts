import type { PlannedSection } from "@repo/contracts";
import { sectionById } from "../catalog";
import { MAX_DENSE_RUN, densityOfLayout, expressiveBudget, motionOf } from "../compose";
import type { Playbook } from "../playbook";

const MAX_ISSUES = 8;

function sequenceIssues(sections: readonly PlannedSection[], expressiveLimit: number): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();
  let denseRun = 0;
  let expressive = 0;
  let previousExpressive = false;
  for (const section of sections) {
    if (seen.has(section.sectionId)) issues.push(`section ${section.sectionId} appears twice`);
    seen.add(section.sectionId);
    denseRun = densityOfLayout(section.layoutPattern) === "high" ? denseRun + 1 : 0;
    if (denseRun === MAX_DENSE_RUN + 1) issues.push(`${MAX_DENSE_RUN + 1} dense sections in a row ending at ${section.sectionId}`);
    const isExpressive = motionOf(sectionById(section.sectionId) ?? {}) === "expressive";
    if (isExpressive && previousExpressive) issues.push(`expressive motion twice in a row at ${section.sectionId}`);
    if (isExpressive) expressive += 1;
    previousExpressive = isExpressive;
  }
  if (expressive > expressiveLimit) issues.push(`${expressive} expressive motion sections; keep ${expressiveLimit} at most`);
  return issues;
}

export function critique(sections: readonly PlannedSection[], playbook?: Playbook | null): string[] {
  const issues: string[] = [];
  const layouts = new Map<string, number>();
  let images = 0;
  let inverses = 0;
  let cardGrids = 0;
  for (let index = 0; index < sections.length; index += 1) {
    const section = sections[index];
    const previous = sections[index - 1];
    if (!section) continue;
    layouts.set(section.layoutPattern, (layouts.get(section.layoutPattern) ?? 0) + 1);
    if (previous?.layoutPattern === section.layoutPattern) issues.push(`repeated layout ${section.layoutPattern}`);
    if (previous?.surface === section.surface) issues.push(`repeated surface ${section.surface}`);
    if (section.layoutPattern === "card-grid") cardGrids += 1;
    if (section.surface === "image") images += 1;
    if (section.surface === "inverse") inverses += 1;
  }
  if (cardGrids > 1) issues.push("more than one card grid");
  if (images > 1) issues.push("more than one full-bleed image");
  if (inverses > 1) issues.push("more than one inverse band");
  for (const [layout, count] of layouts) {
    if (count >= 3) issues.push(`layout ${layout} appears ${count} times`);
  }
  const heroAt = sections.findIndex((section) => section.purpose === "hero");
  if (heroAt > 0) issues.push("hero is not first");
  return [...issues, ...sequenceIssues(sections, expressiveBudget(playbook))].slice(0, MAX_ISSUES);
}
