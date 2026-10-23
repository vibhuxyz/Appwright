import type { DesignBlock, Page, PlannedSection } from "@repo/contracts";
import { themeFit } from "../theme";
import { critique } from "./critique";

const MAX_LINE = 500;

function clip(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length <= MAX_LINE ? flat : `${flat.slice(0, MAX_LINE - 1).trimEnd()}…`;
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

export function formatSectionBrief(page: Page, design: DesignBlock): string[] {
  const sections = page.sections ?? [];
  if (sections.length === 0) return [];
  const lines = [
    "Section composition. Implement these sections in this order and do not add others.",
    themeFit(design).directive,
    "Do not invent reviews, names, ratings, or business facts. A missing image is a placeholder with its alt text and aspect ratio, never an unrelated photo.",
  ];
  sections.forEach((section, index) => {
    lines.push(sectionLine(section, sections[index - 1]));
  });
  const issues = critique(sections);
  if (issues.length > 0) lines.push(`Composition notes: ${issues.join("; ")}`);
  return lines;
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
  const issues = pages.flatMap((page) => critique(page.sections ?? []).map((issue) => `${page.route}: ${issue}`));
  if (issues.length > 0) lines.push(`Composition issues: ${issues.slice(0, 8).join("; ")}`);
  return lines;
}
