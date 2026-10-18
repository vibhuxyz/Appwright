import type { TaskStatus } from "@repo/contracts";

export interface SchedulableTask {
  id: string;
  status: TaskStatus;
  dependsOn: readonly string[];
  owns: readonly string[];
}

export interface SchedulerCapacity {
  maxConcurrent: number;
  budgetRemainingCents: number;
  estimatedCostCents: number;
}

export type WaitReason =
  | { kind: "dependency"; blockedOn: string[] }
  | { kind: "ownership"; conflictsWith: string }
  | { kind: "capacity"; maxConcurrent: number }
  | { kind: "budget"; remainingCents: number; neededCents: number }
  | { kind: "upstream_failed"; failedDependencies: string[] };

export interface WaitingTask {
  taskId: string;
  reason: WaitReason;
}

export interface SchedulerDecision {
  dispatch: string[];
  waiting: WaitingTask[];
}
