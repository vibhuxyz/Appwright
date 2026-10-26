import type { AssetSlot, Blueprint } from "@repo/contracts";
import { formatSectionBrief } from "@repo/ui-system";
import { describeAssetSlot } from "../asset-hints";
import { PAGE_UI_ACCEPTANCE, PLANNED_PAGE_ACCEPTANCE } from "../build-task-prompt";
import {
  BRIEF_TAG,
  MAX_BRIEF_COMPONENTS,
  MAX_BRIEF_PURPOSE_CHARS,
  MAX_BRIEF_SLOTS,
  MAX_SINGLE_PASS_BRIEF_BYTES,
  SINGLE_PASS_RULES,
} from "./constants";

type BriefPage = Blueprint["pages"][number];

export interface SinglePassBrief {
  readonly text: string;
  readonly cutLines: number;
}

function flatten(text: string, maxChars: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length <= maxChars ? flat : `${flat.slice(0, maxChars - 1).trimEnd()}…`;
}

function componentLine(components: readonly string[]): string {
  if (components.length === 0) return "Components: none listed";
  const shown = components.slice(0, MAX_BRIEF_COMPONENTS);
  const hidden = components.length - shown.length;
  return `Components: ${shown.join(", ")}${hidden > 0 ? ` (+${hidden} more)` : ""}`;
}

function pageLines(page: BriefPage, design: Blueprint["design"]): string[] {
  return [
    ``,
    `Page ${page.route}: ${flatten(page.purpose, MAX_BRIEF_PURPOSE_CHARS)}`,
    componentLine(page.components),
    ...formatSectionBrief(page, design),
  ];
}

function compareRoutes(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

function slotLines(slots: readonly AssetSlot[]): string[] {
  if (slots.length === 0) return [];
  const sorted = [...slots].sort((a, b) => compareRoutes(a.pageRoute, b.pageRoute));
  const shown = sorted.slice(0, MAX_BRIEF_SLOTS);
  const hidden = sorted.length - shown.length;
  return [
    ``,
    `Images:`,
    ...shown.map((slot) => `- ${slot.pageRoute} ${describeAssetSlot(slot)}`),
    ...(hidden > 0 ? [`(+${hidden} more images, use neutral placeholders for them)`] : []),
  ];
}

function acceptanceLines(blueprint: Blueprint): string[] {
  const hasPlannedSections = blueprint.pages.some((page) => (page.sections?.length ?? 0) > 0);
  const required = (blueprint.requirements ?? [])
    .filter((requirement) => requirement.level === "required")
    .flatMap((requirement) => requirement.acceptance);
  const criteria = [...PAGE_UI_ACCEPTANCE, ...(hasPlannedSections ? [PLANNED_PAGE_ACCEPTANCE] : []), ...required];
  return [``, `Acceptance criteria (all must hold when you finish):`, ...criteria.map((criterion) => `- ${criterion}`)];
}

function fitToBudget(lines: readonly string[], maxBytes: number): { kept: string[]; cutLines: number } {
  const kept: string[] = [];
  let usedBytes = 0;
  for (const line of lines) {
    const lineBytes = Buffer.byteLength(line, "utf8") + 1;
    if (usedBytes + lineBytes > maxBytes) break;
    kept.push(line);
    usedBytes += lineBytes;
  }
  return { kept, cutLines: lines.length - kept.length };
}

function escapeBriefTag(text: string): string {
  return text.replaceAll(`</${BRIEF_TAG}>`, `<\\/${BRIEF_TAG}>`);
}

export function buildSinglePassBrief(input: {
  blueprint: Blueprint;
  slots: readonly AssetSlot[];
}): SinglePassBrief {
  const { blueprint, slots } = input;
  const lines = [
    `The plan is approved and the theme is applied. Build the site now from this brief.`,
    ...SINGLE_PASS_RULES.map((rule) => `- ${rule}`),
    `Pages to build (link only to these routes):`,
    ...blueprint.pages.flatMap((page) => pageLines(page, blueprint.design)),
    ...slotLines(slots),
    ...acceptanceLines(blueprint),
  ];
  const { kept, cutLines } = fitToBudget(lines, MAX_SINGLE_PASS_BRIEF_BYTES);
  const notice = cutLines > 0 ? [`(${cutLines} brief lines cut to fit the ${MAX_SINGLE_PASS_BRIEF_BYTES} byte budget)`] : [];
  const body = escapeBriefTag([...kept, ...notice].join("\n"));
  return { text: `<${BRIEF_TAG}>\n${body}\n</${BRIEF_TAG}>`, cutLines };
}
