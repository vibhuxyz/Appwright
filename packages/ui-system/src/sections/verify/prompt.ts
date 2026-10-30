import type { DesignBlock, Page, PlannedSection } from "@repo/contracts";
import { PATTERN_PROPS, patternById, patternImportPath } from "../../patterns";
import { sectionById } from "../catalog";
import { formatComposition, planComposition } from "../compose";
import { experienceSeed, formatExperience, planExperience } from "../experience";
import { themeFit } from "../theme";
import { detectPlaybook } from "../playbook";
import { critique } from "./critique";

const MAX_LINE = 500;
const MAX_PATTERN_LINE = 1000;

function clip(text: string, limit = MAX_LINE): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length <= limit ? flat : `${flat.slice(0, limit - 1).trimEnd()}…`;
}

function sectionLine(section: PlannedSection, previous: PlannedSection | undefined): string {
  const follows = previous
    ? `Follows ${previous.purpose}; surface ${previous.surface} to ${section.surface}.`
    : "Opens the page.";
  const assets = section.assetPurposes.length > 0 ? section.assetPurposes.join(", ") : "none";
  return clip(
    `${section.sectionId} variant ${section.variantId}. ${section.reason} ${follows} Width ${section.width}, spacing ${section.spacing}, aspect ${section.imageAspect ?? "none"}. Fields: ${section.contentFields.join(", ")}. Assets: ${assets}. ${section.responsive} ${section.interactions.join("; ")}. Root element data-section="${section.sectionId}".`,
  );
}

function patternLine(sectionId: string): string | undefined {
  const patternId = sectionById(sectionId)?.patternId;
  const pattern = patternId ? patternById(patternId) : undefined;
  if (!pattern) return undefined;
  const props = PATTERN_PROPS[pattern.id];
  const propsNote = props ? ` Props ${props}; pass exactly these types (named types such as MediaImage are exported from the same file).` : "";
  return clip(
    `  Pattern ready on disk: import { ${pattern.exportName} } from "${patternImportPath(pattern.file)}". Render it with this business's real content as props; change classes only to fit the theme, do not rebuild it.${propsNote} Use: ${pattern.usage} Avoid: ${pattern.antiPatterns.join("; ")}.`,
    MAX_PATTERN_LINE,
  );
}

export function formatSectionBrief(page: Page, design: DesignBlock, projectId?: string): string[] {
  const sections = page.sections ?? [];
  if (sections.length === 0) return [];
  const lines = [
    "Section composition. Implement these sections in this order and do not add others.",
    themeFit(design).directive,
    "Do not invent reviews, names, ratings, or business facts. A missing image is a placeholder with its alt text and aspect ratio, never an unrelated photo.",
  ];
  const plan = planComposition(page, design);
  if (plan) lines.push(...formatComposition(plan), ...formatExperience(planExperience(plan, { briefText: page.purpose, seed: experienceSeed({ page, design, projectId }) })));
  sections.forEach((section, index) => {
    lines.push(sectionLine(section, sections[index - 1]));
    const pattern = patternLine(section.sectionId);
    if (pattern) lines.push(pattern);
  });
  const issues = critique(sections, detectPlaybook(page.purpose));
  if (issues.length > 0) lines.push(`Composition notes: ${issues.join("; ")}`);
  return lines;
}

export function formatShellBrief(sectionIds: readonly string[]): string[] {
  const lines = sectionIds.flatMap((sectionId) => {
    const line = patternLine(sectionId);
    return line ? [`- ${sectionId}:${line.trimStart().replace(/^Pattern ready on disk:/, "")}`] : [];
  });
  return lines.length > 0 ? ["Shared shell patterns for the root layout:", ...lines] : [];
}

export function formatEvidenceBrief(pages: readonly Page[]): string[] {
  const lines = [
    "Visual verification evidence. Record each check as passed, failed, or not-executed. A successful compile is not a visual pass.",
  ];
  for (const page of pages.slice(0, 12)) {
    const ids = (page.sections ?? []).map((section) => section.sectionId);
    if (ids.length > 0) lines.push(`${page.route}: render data-section markers for ${ids.join(", ")}.`);
  }
  lines.push("Screenshots, overflow, and click-through stay not-executed until a browser run records them.");
  const issues = pages.flatMap((page) => critique(page.sections ?? [], detectPlaybook(page.purpose)).map((issue) => `${page.route}: ${issue}`));
  if (issues.length > 0) lines.push(`Composition issues: ${issues.slice(0, 8).join("; ")}`);
  return lines;
}
