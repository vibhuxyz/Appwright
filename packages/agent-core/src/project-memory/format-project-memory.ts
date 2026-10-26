import type { ProjectMemoryRows } from "@repo/contracts";
import { HEADINGS, MAX_PROJECT_MEMORY_BYTES, MEMORY_PREAMBLE, PROJECT_MEMORY_TAG, SECTION_LIMITS } from "./constants";
import {
  acceptanceItems,
  assumedItems,
  changedFileItems,
  confirmedItems,
  featureItems,
  goalItems,
  openItems,
  pageItems,
  readFileItems,
  taskItems,
  verificationItems,
} from "./sections";
import { section } from "./text";
import { buildWorkLedger } from "./work-ledger";

const OPEN_TAG = `<${PROJECT_MEMORY_TAG}>`;
const CLOSE_TAG = `</${PROJECT_MEMORY_TAG}>`;
const TRIM_NOTE_RESERVE_BYTES = 64;

function byteLength(text: string): number {
  return Buffer.byteLength(text, "utf8");
}

function memoryLines(rows: ProjectMemoryRows): string[] {
  const ledger = buildWorkLedger(rows.toolCallRows);
  const blueprint = rows.blueprint;
  return [
    ...section(HEADINGS.confirmed, confirmedItems(rows.userRows), SECTION_LIMITS.confirmed),
    ...section(HEADINGS.open, openItems(rows), SECTION_LIMITS.open),
    ...section(HEADINGS.assumed, assumedItems(rows.questions), SECTION_LIMITS.assumed),
    ...(blueprint ? section(HEADINGS.goal, goalItems(blueprint), SECTION_LIMITS.confirmed) : []),
    ...(blueprint ? section(HEADINGS.tasks, taskItems(blueprint), SECTION_LIMITS.tasks) : []),
    ...section(HEADINGS.verification, verificationItems(rows.assistantRows), SECTION_LIMITS.verification),
    ...section(HEADINGS.changedFiles, changedFileItems(ledger), SECTION_LIMITS.changedFiles),
    ...(blueprint ? section(HEADINGS.acceptance, acceptanceItems(blueprint), SECTION_LIMITS.acceptance) : []),
    ...(blueprint ? section(HEADINGS.pages, pageItems(blueprint), SECTION_LIMITS.pages) : []),
    ...(blueprint ? section(HEADINGS.features, featureItems(blueprint), SECTION_LIMITS.features) : []),
    ...section(HEADINGS.readFiles, readFileItems(ledger), SECTION_LIMITS.readFiles),
  ];
}

function fitToBudget(lines: readonly string[], budgetBytes: number): { kept: string[]; cut: number } {
  const kept: string[] = [];
  let used = 0;
  for (const line of lines) {
    const cost = byteLength(line) + 1;
    if (used + cost > budgetBytes) break;
    kept.push(line);
    used += cost;
  }
  return { kept, cut: lines.length - kept.length };
}

export function formatProjectMemory(rows: ProjectMemoryRows): string {
  const lines = memoryLines(rows);
  if (lines.length === 0) return "";
  const frame = `${OPEN_TAG}\n${MEMORY_PREAMBLE}\n${CLOSE_TAG}`;
  const budget = MAX_PROJECT_MEMORY_BYTES - byteLength(frame) - TRIM_NOTE_RESERVE_BYTES;
  const { kept, cut } = fitToBudget(lines, budget);
  const trimNote = cut > 0 ? [`(memory trimmed: ${cut} lower-priority lines left out)`] : [];
  return [OPEN_TAG, MEMORY_PREAMBLE, ...kept, ...trimNote, CLOSE_TAG].join("\n");
}
