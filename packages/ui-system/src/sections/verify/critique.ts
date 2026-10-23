import type { PlannedSection } from "@repo/contracts";

const MAX_ISSUES = 8;

export function critique(sections: readonly PlannedSection[]): string[] {
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
  return issues.slice(0, MAX_ISSUES);
}
