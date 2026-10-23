import { formatEvidenceBrief, formatSectionBrief } from "@repo/ui-system";
import { pageRouteOf } from "./asset-hints";
import type { TaskDetail } from "./load-task-detail";

const PAGE_UI_ACCEPTANCE = [
  "Import Modal, Carousel, Testimonials, toast, PageSkeleton and Spinner from src/components/ui. Do not hand-roll them.",
  "Add a sibling loading.tsx that renders PageSkeleton.",
  "Call toast.success or toast.error after every form submit.",
  "Use Modal or ConfirmModal for any popup.",
];

const HOME_UI_ACCEPTANCE =
  "The landing page includes Testimonials and a Carousel of featured items or photos.";

const PLANNED_PAGE_ACCEPTANCE =
  "Implement only the listed sections. Do not add a review block unless a testimonial section is listed.";

function pageFor(task: TaskDetail) {
  const route = pageRouteOf(task.title);
  return task.pages.find((page) => page.route === route);
}

function uiAcceptanceFor(task: TaskDetail): string[] {
  if (task.type.toLowerCase() !== "page") return [];
  const planned = (pageFor(task)?.sections?.length ?? 0) > 0;
  if (planned) return [...PAGE_UI_ACCEPTANCE, PLANNED_PAGE_ACCEPTANCE];
  const isHome = /page \/:|home|landing|marketing/i.test(task.title);
  return isHome ? [...PAGE_UI_ACCEPTANCE, HOME_UI_ACCEPTANCE] : PAGE_UI_ACCEPTANCE;
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
    ];
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
