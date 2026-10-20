import type { Capability, RiskTier, TaskStatus, TaskType } from "@repo/contracts";

const TASK_STATUS_BY_PRISMA: Record<string, TaskStatus> = {
  PENDING: "pending",
  READY: "ready",
  RUNNING: "running",
  BLOCKED: "blocked",
  FAILED: "failed",
  DONE: "done",
};

export function taskStatusFromPrisma(status: string): TaskStatus {
  return TASK_STATUS_BY_PRISMA[status] ?? "pending";
}

export function lowercaseEnum<T extends string>(value: string): T {
  return value.toLowerCase() as T;
}

export interface MappedTask {
  id: string;
  type: TaskType;
  title: string;
  status: TaskStatus;
  dependsOn: string[];
  owns: string[];
  reads: string[];
  riskTier: RiskTier;
  capability: Capability;
}

export function mapTaskRow(row: {
  id: string;
  type: string;
  title: string;
  status: string;
  dependsOn: unknown;
  owns: unknown;
  reads: unknown;
  riskTier: string;
  capability: string;
}): MappedTask {
  return {
    id: row.id,
    type: lowercaseEnum<TaskType>(row.type),
    title: row.title,
    status: taskStatusFromPrisma(row.status),
    dependsOn: row.dependsOn as string[],
    owns: row.owns as string[],
    reads: row.reads as string[],
    riskTier: lowercaseEnum<RiskTier>(row.riskTier),
    capability: lowercaseEnum<Capability>(row.capability),
  };
}
