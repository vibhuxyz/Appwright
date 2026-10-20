import type { PlanTask } from "../schemas/plan-schemas";

const SETTLED_STATUSES: ReadonlySet<PlanTask["status"]> = new Set([
  "done",
  "failed",
  "blocked",
]);

export interface PlanProgress {
  done: number;
  total: number;
}

export function summarizeProgress(tasks: readonly PlanTask[]): PlanProgress {
  return {
    done: tasks.filter((task) => task.status === "done").length,
    total: tasks.length,
  };
}

export function isPlanSettled(tasks: readonly PlanTask[]): boolean {
  return tasks.length > 0 && tasks.every((task) => SETTLED_STATUSES.has(task.status));
}

export function formatProgress({ done, total }: PlanProgress): string {
  return `${done}/${total} tasks`;
}
