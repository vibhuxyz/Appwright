import type { AssetSlot, Blueprint } from "@repo/contracts";
import { formatSectionBrief, formatShellBrief } from "@repo/ui-system";
import { describeAssetSlot } from "../asset-hints";
import { shellSectionIdsFor, type PatternDeliveryResult } from "../patterns";
import { PAGE_UI_ACCEPTANCE, PLANNED_PAGE_ACCEPTANCE } from "../build-task-prompt";
import {
  BRIEF_TAG,
  MAX_BRIEF_COMPONENTS,
  MAX_BRIEF_PURPOSE_CHARS,
  MAX_BRIEF_SLOTS,
  MAX_SINGLE_PASS_BRIEF_BYTES,
  SINGLE_PASS_RULES,
} from "./constants";
import { fitBriefLines, type PrioritizedLine } from "./fit-brief";

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

function pageLines(page: BriefPage, design: Blueprint["design"], projectId: string): PrioritizedLine[] {
  return [
    { priority: 3, text: `` },
    { priority: 3, text: `Page ${page.route}: ${flatten(page.purpose, MAX_BRIEF_PURPOSE_CHARS)}` },
    { priority: 3, text: componentLine(page.components) },
    ...formatSectionBrief(page, design, projectId).map((text) => ({ priority: 0, text })),
  ];
}

function compareRoutes(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

function slotLines(slots: readonly AssetSlot[]): PrioritizedLine[] {
  if (slots.length === 0) return [];
  const sorted = [...slots].sort((a, b) => compareRoutes(a.pageRoute, b.pageRoute));
  const shown = sorted.slice(0, MAX_BRIEF_SLOTS);
  const hidden = sorted.length - shown.length;
  return [
    { priority: 1, text: `` },
    { priority: 1, text: `Images:` },
    ...shown.map((slot) => ({ priority: 1, text: `- ${slot.pageRoute} ${describeAssetSlot(slot)}` })),
    ...(hidden > 0 ? [{ priority: 1, text: `(+${hidden} more images, use neutral placeholders for them)` }] : []),
  ];
}

function acceptanceLines(blueprint: Blueprint): PrioritizedLine[] {
  const hasPlannedSections = blueprint.pages.some((page) => (page.sections?.length ?? 0) > 0);
  const required = (blueprint.requirements ?? [])
    .filter((requirement) => requirement.level === "required")
    .flatMap((requirement) => requirement.acceptance);
  const criteria = [...PAGE_UI_ACCEPTANCE, ...(hasPlannedSections ? [PLANNED_PAGE_ACCEPTANCE] : []), ...required];
  return [
    { priority: 2, text: `` },
    { priority: 2, text: `Acceptance criteria (all must hold when you finish):` },
    ...criteria.map((text) => ({ priority: 2, text: `- ${text}` })),
  ];
}

function shellLines(blueprint: Blueprint, delivery: PatternDeliveryResult): PrioritizedLine[] {
  const deliveredIds = new Set(delivery.patternIds);
  return formatShellBrief(shellSectionIdsFor(blueprint).filter((id) => deliveredIds.has(id))).map((text) => ({
    priority: 1,
    text,
  }));
}

const NOTICE_RESERVE_BYTES = 80;

function escapeBriefTag(text: string): string {
  return text.replaceAll(`</${BRIEF_TAG}>`, `<\\/${BRIEF_TAG}>`);
}

export function buildSinglePassBrief(input: {
  blueprint: Blueprint;
  slots: readonly AssetSlot[];
  projectId: string;
  delivery: PatternDeliveryResult;
}): SinglePassBrief {
  const { blueprint, slots, projectId, delivery } = input;
  const lines: PrioritizedLine[] = [
    { priority: 3, text: `The plan is approved and the theme is applied. Build the site now from this brief.` },
    ...SINGLE_PASS_RULES.map((rule) => ({ priority: 3, text: `- ${rule}` })),
    ...shellLines(blueprint, delivery),
    { priority: 3, text: `Pages to build (link only to these routes):` },
    ...blueprint.pages.flatMap((page) => pageLines(page, blueprint.design, projectId)),
    ...slotLines(slots),
    ...acceptanceLines(blueprint),
  ];
  const wrapperBytes = Buffer.byteLength(`<${BRIEF_TAG}>\n\n</${BRIEF_TAG}>`, "utf8");
  const { kept, cutLines } = fitBriefLines(lines, MAX_SINGLE_PASS_BRIEF_BYTES - wrapperBytes - NOTICE_RESERVE_BYTES);
  const notice = cutLines > 0 ? [`(${cutLines} brief lines cut to fit the ${MAX_SINGLE_PASS_BRIEF_BYTES} byte budget)`] : [];
  const body = escapeBriefTag([...kept, ...notice].join("\n"));
  return { text: `<${BRIEF_TAG}>\n${body}\n</${BRIEF_TAG}>`, cutLines };
}
