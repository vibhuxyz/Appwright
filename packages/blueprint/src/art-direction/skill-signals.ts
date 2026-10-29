import { effectById, patternById, type SkillSignals } from "@repo/ui-system";
import type { TaskDetail } from "../load-task-detail";

const UI_TASK_TYPES: ReadonlySet<string> = new Set(["page", "component", "app-shell", "layout"]);

export function isUiTaskType(type: string): boolean {
  return UI_TASK_TYPES.has(type.toLowerCase());
}

const INTERACTIVE_CATEGORIES: ReadonlySet<string> = new Set(["pointer", "canvas"]);

function isInteractiveEffect(id: string): boolean {
  const effect = effectById(id);
  return effect !== undefined && (INTERACTIVE_CATEGORIES.has(effect.category) || effect.level === "choreography");
}

export function skillSignalsFor(
  task: TaskDetail,
  patternIds: readonly string[],
  previousError: string | undefined,
  effectIds: readonly string[] = [],
): SkillSignals {
  const type = task.type.toLowerCase();
  return {
    isUiTask: isUiTaskType(type),
    hasSections: type === "page",
    hasMotion: patternIds.some((id) => (patternById(id)?.motion ?? "none") !== "none") || effectIds.length > 0,
    hasInteraction: effectIds.some(isInteractiveEffect),
    hasImages: task.assetHints.length > 0,
    isRepair: previousError !== undefined && UI_TASK_TYPES.has(type),
  };
}
