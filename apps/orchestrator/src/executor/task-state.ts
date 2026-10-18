import type { TaskStatus } from "@repo/contracts";
import type { SchedulableTask } from "../scheduler";
import type { ExecutableTask } from "./types";

export interface TaskState {
  status: TaskStatus;
  attemptsMade: number;
}

export function resumeStatus(status: TaskStatus, retryFailed: boolean): TaskStatus {
  if (status === "running" || status === "blocked" || status === "ready") return "pending";
  if (status === "failed" && retryFailed) return "pending";
  return status;
}

export function initialStates(
  tasks: readonly ExecutableTask[],
  retryFailed: boolean,
): Map<string, TaskState> {
  return new Map(
    tasks.map((task) => [
      task.id,
      { status: resumeStatus(task.status, retryFailed), attemptsMade: task.attemptsMade },
    ]),
  );
}

export function toSchedulable(
  tasks: readonly ExecutableTask[],
  states: ReadonlyMap<string, TaskState>,
): SchedulableTask[] {
  return tasks.map((task) => ({
    id: task.id,
    dependsOn: task.dependsOn,
    owns: task.owns,
    status: states.get(task.id)?.status ?? task.status,
  }));
}

export function idsWithStatus(
  tasks: readonly ExecutableTask[],
  states: ReadonlyMap<string, TaskState>,
  status: TaskStatus,
): string[] {
  return tasks
    .filter((task) => states.get(task.id)?.status === status)
    .map((task) => task.id)
    .sort();
}
