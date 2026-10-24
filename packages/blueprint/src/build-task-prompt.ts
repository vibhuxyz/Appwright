import { formatEvidenceBrief, formatSectionBrief } from "@repo/ui-system";
import { pageRouteOf } from "./asset-hints";
import type { TaskDetail } from "./load-task-detail";

const PAGE_UI_ACCEPTANCE = [
  "Import Modal, Carousel, toast, PageSkeleton and Spinner from src/components/ui when this task uses them. Do not hand-roll them.",
  "Add a sibling loading.tsx that renders PageSkeleton.",
  "Call toast.success or toast.error after every form submit.",
  "Use Modal or ConfirmModal for any popup.",
  "Do not invent a shop, cart, sample brand, prices, or reviews. A missing image is a neutral placeholder with its alt text. Do not create, read, or rewrite .png, .jpg, .webp, or .gif files.",
];

const SCAFFOLD_ACCEPTANCE = [
  "Do not install packages before they are needed. Add dependencies only when a concrete requirement in the project needs them.",
  "Check whether the existing stack covers the functionality before adding a library. Never install stripe, next-auth, or zustand unless specifically required by the project plan.",
];

const PLANNED_PAGE_ACCEPTANCE =
  "Implement only the listed sections. Do not add a review block unless a testimonial section is listed.";

const MAX_PAGE_LINES = 12;
const MAX_PURPOSE_CHARS = 180;

function pageFor(task: TaskDetail) {
  const route = pageRouteOf(task.title);
  return task.pages.find((page) => page.route === route);
}

function uiAcceptanceFor(task: TaskDetail): string[] {
  const type = task.type.toLowerCase();
  if (type === "scaffold") return SCAFFOLD_ACCEPTANCE;
  if (type !== "page") return [];
  const planned = (pageFor(task)?.sections?.length ?? 0) > 0;
  return planned ? [...PAGE_UI_ACCEPTANCE, PLANNED_PAGE_ACCEPTANCE] : PAGE_UI_ACCEPTANCE;
}

function clipPurpose(purpose: string): string {
  const flat = purpose.replace(/\s+/g, " ").trim();
  if (flat.length <= MAX_PURPOSE_CHARS) return flat;
  return `${flat.slice(0, MAX_PURPOSE_CHARS - 1).trimEnd()}…`;
}

function productLines(task: TaskDetail): string[] {
  const shown = task.pages.slice(0, MAX_PAGE_LINES);
  const hidden = task.pages.length - shown.length;
  const listed = shown.map((page) => `- ${page.route}: ${clipPurpose(page.purpose)}`);
  const more = hidden > 0 ? [`(+${hidden} more)`] : [];
  return [
    "Product pages:",
    ...(listed.length > 0 ? listed : ["- none listed"]),
    ...more,
    "Take the business name and facts from these purposes. Link only to these routes. Do not invent a shop, cart, catalog, sample brand, prices, reviews, or any link that is not a page here.",
  ];
}

function compositionLines(task: TaskDetail): string[] {
  const type = task.type.toLowerCase();
  if (type === "page") {
    const page = pageFor(task);
    return page ? formatSectionBrief(page, task.design) : [];
  }
  if (type === "app-shell") {
    return [
      "Build the navigation and footer named in the task title once, and share them across pages.",
      ...productLines(task),
    ];
  }
  if (type === "component") {
    return ["Build only shared pieces these pages use.", ...productLines(task)];
  }
  if (type === "visual-verification") return formatEvidenceBrief(task.pages);
  return [];
}

export function buildTaskPrompt(
  task: TaskDetail,
  previousError: string | undefined,
  standards?: string,
): string {
  const lines = [
    ...(standards ? [standards, ``] : []),
    `You are completing one task of a larger build. Work only inside the files listed below.`,
    ``,
    `Task: ${task.title}`,
    `Type: ${task.type}`,
    `Files you may create or edit (owns): ${task.owns.join(", ")}`,
    `Files you may read for context (reads): ${task.reads.length > 0 ? task.reads.join(", ") : "none"}`,
    ``,
    `Use list_files/read_file to explore reads before writing. Write only paths that match owns.`,
    `When the task is complete, stop making tool calls.`,
  ];
  const acceptance = [...task.acceptance, ...uiAcceptanceFor(task)];
  if (acceptance.length > 0) {
    lines.push(``, `Acceptance criteria (all must hold when you finish):`);
    lines.push(...acceptance.map((criterion) => `- ${criterion}`));
  }
  const composition = compositionLines(task);
  if (composition.length > 0) {
    lines.push(``, ...composition);
  }
  if (task.assetHints.length > 0) {
    lines.push(``, `Images this page needs:`);
    lines.push(...task.assetHints.map((hint) => `- ${hint}`));
  }
  if (previousError) {
    lines.push(``, `The previous attempt failed: ${previousError}`, `Fix that and try again.`);
  }
  return lines.join("\n");
}
