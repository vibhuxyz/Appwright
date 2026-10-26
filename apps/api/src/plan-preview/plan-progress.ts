import type { BlueprintProgress } from "@repo/blueprint";
import type { IntakeProgress } from "../intake";

const MAX_LINE_CHARS = 160;

function sectionName(component: string): string {
  return component.replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2").replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}

function pageLine(page: { route: string; components: readonly string[] }): string {
  const sections = page.components.map(sectionName).join(", ");
  const line = sections ? `${page.route} — ${sections}` : page.route;
  return line.length > MAX_LINE_CHARS ? `${line.slice(0, MAX_LINE_CHARS - 1)}…` : line;
}

export function toPlannerProgress(progress: BlueprintProgress): IntakeProgress {
  if (progress.stage === "pages") return { tool: "planner", detail: progress.detail, items: progress.pages.map(pageLine) };
  return { tool: "planner", detail: progress.detail };
}
