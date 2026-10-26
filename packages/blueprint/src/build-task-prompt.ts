import { formatEvidenceBrief, formatSectionBrief } from "@repo/ui-system";
import { pageRouteOf } from "./asset-hints";
import type { TaskDetail } from "./load-task-detail";

export const PAGE_UI_ACCEPTANCE = [
  "Import Modal, Carousel, toast, PageSkeleton and Spinner from src/components/ui when this task uses them. Do not hand-roll them.",
  "Add a sibling loading.tsx that renders PageSkeleton.",
  "Call toast.success or toast.error after every form submit.",
  "Use Modal or ConfirmModal for any popup.",
  "Do not invent a shop, cart, sample brand, prices, or reviews. A missing image is a neutral placeholder with its alt text. Do not create, read, or rewrite .png, .jpg, .webp, or .gif files.",
];

const SCAFFOLD_ACCEPTANCE = [
  "Do not install packages before they are needed. Add dependencies only when a concrete requirement in the project needs them.",
  "Check whether the existing stack covers the functionality before adding a library. Payments use Appwrite's Razorpay integration gateway; do not install a payment provider SDK. Never install next-auth or zustand unless specifically required by the project plan.",
];

export const PLANNED_PAGE_ACCEPTANCE =
  "Implement only the listed sections. Do not add a review block unless a testimonial section is listed.";

const MAX_PAGE_LINES = 12;
const MAX_PURPOSE_CHARS = 180;
const MAX_TREE_ENTRIES = 60;
const UI_PRIMITIVES_DIR = "components/ui/";
const GATEWAY_TASK_TYPES: ReadonlySet<string> = new Set(["auth", "payment", "api", "media", "security", "admin"]);

export interface TaskPromptContext {
  readonly standards?: string;
  readonly projectTree?: readonly string[];
}

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

function gatewayLines(type: string): string[] {
  if (!GATEWAY_TASK_TYPES.has(type.toLowerCase())) return [];
  return [
    `Integration credentials are server-only. Generated server routes must call the Appwrite integration gateway with APPWRITE_API_URL and APPWRITE_INTEGRATION_TOKEN; never place provider secrets or the gateway token in client code, public build variables, source maps, or chat messages.`,
    `Use the Brevo email gateway at /v1/integrations/email/send, the Razorpay order and verification gateway at /v1/integrations/razorpay/orders and /v1/integrations/razorpay/verify, and the Cloudinary upload gateway at /v1/integrations/cloudinary/upload. Validate all user input on the server.`,
  ];
}

function projectTreeLines(projectTree: readonly string[]): string[] {
  if (projectTree.length === 0) return [];
  const kept = projectTree.filter((entry) => !entry.includes(UI_PRIMITIVES_DIR)).sort();
  const shown = kept.slice(0, MAX_TREE_ENTRIES);
  const hidden = projectTree.length - shown.length;
  return [
    ``,
    `Project files already on disk (no need to list_files to find them):`,
    ...shown.map((entry) => `- ${entry}`),
    ...(hidden > 0 ? [`(+${hidden} more, including the src/components/ui primitives)`] : []),
  ];
}

function headerLines(task: TaskDetail, context: TaskPromptContext): string[] {
  return [
    ...(context.standards ? [context.standards, ``] : []),
    `You are completing one task of a larger build. Work only inside the files listed below.`,
    ``,
    `Task: ${task.title}`,
    `Type: ${task.type}`,
    `Files you may create or edit (owns): ${task.owns.join(", ")}`,
    `Files you may read for context (reads): ${task.reads.length > 0 ? task.reads.join(", ") : "none"}`,
    ...projectTreeLines(context.projectTree ?? []),
    ``,
    `Read only the files from reads that you need, once each. Write only paths that match owns.`,
    `Do not run installs, tsc or builds: the sandbox has no node_modules, and the workspace is verified after this task.`,
    ...gatewayLines(task.type),
    `When the task is complete, stop making tool calls.`,
  ];
}

export function buildTaskPrompt(
  task: TaskDetail,
  previousError: string | undefined,
  context: TaskPromptContext = {},
): string {
  const lines = headerLines(task, context);
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
  if (task.specification) {
    const isUi = ["page", "component", "app-shell", "theme", "layout"].includes(
      task.type.toLowerCase(),
    );
    if (isUi && task.specification.designSystem) {
      lines.push(
        ``,
        `Visual reference direction: ${task.specification.designSystem.visualDirection}`,
      );
      if (task.specification.designSystem.colors.length > 0) {
        const colorList = task.specification.designSystem.colors
          .map((c) => `${c.role}: ${c.hex}`)
          .join(", ");
        lines.push(`Colors: ${colorList}`);
      }
    }
  }
  if (previousError) {
    lines.push(``, `The previous attempt failed: ${previousError}`, `Fix that and try again.`);
  }
  return lines.join("\n");
}
