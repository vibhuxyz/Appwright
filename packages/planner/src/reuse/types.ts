import type { TaskType } from "@repo/contracts";

export type ReuseAction = "reuse" | "configure" | "generate";

export interface ReuseCapability {
  readonly id: string;
  readonly label: string;
  readonly taskTypes: readonly TaskType[];
  readonly action: ReuseAction;
  readonly evidence: string;
}

export interface ReuseReportEntry {
  readonly taskId: string;
  readonly taskTitle: string;
  readonly taskType: TaskType;
  readonly action: ReuseAction;
  readonly capability: string | null;
  readonly evidence: string;
}
