import { dependencyGate, ownershipGate } from "./gates";
import type {
  SchedulableTask,
  SchedulerCapacity,
  SchedulerDecision,
  WaitingTask,
  WaitReason,
} from "./types";

const DISPATCHABLE_STATUSES: ReadonlySet<string> = new Set(["pending", "ready"]);

function capacityGate(
  activeCount: number,
  capacity: SchedulerCapacity,
): WaitReason | undefined {
  return activeCount >= capacity.maxConcurrent
    ? { kind: "capacity", maxConcurrent: capacity.maxConcurrent }
    : undefined;
}

function budgetGate(
  remainingCents: number,
  capacity: SchedulerCapacity,
): WaitReason | undefined {
  return remainingCents < capacity.estimatedCostCents
    ? {
        kind: "budget",
        remainingCents,
        neededCents: capacity.estimatedCostCents,
      }
    : undefined;
}

export function selectNextTasks(
  tasks: readonly SchedulableTask[],
  capacity: SchedulerCapacity,
): SchedulerDecision {
  const statusById = new Map(tasks.map((task) => [task.id, task.status]));
  const active = tasks.filter((task) => task.status === "running");
  const candidates = tasks.filter((task) => DISPATCHABLE_STATUSES.has(task.status));

  const dispatch: string[] = [];
  const waiting: WaitingTask[] = [];
  let remainingCents = capacity.budgetRemainingCents;

  for (const task of candidates) {
    const reason =
      dependencyGate(task, statusById) ??
      ownershipGate(task, active) ??
      capacityGate(active.length, capacity) ??
      budgetGate(remainingCents, capacity);

    if (reason) {
      waiting.push({ taskId: task.id, reason });
      continue;
    }
    dispatch.push(task.id);
    active.push(task);
    remainingCents -= capacity.estimatedCostCents;
  }
  return { dispatch, waiting };
}
