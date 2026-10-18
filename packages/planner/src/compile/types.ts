import type { Task } from "@repo/contracts";

export type TaskSpec = Pick<
  Task,
  | "id"
  | "type"
  | "title"
  | "owns"
  | "reads"
  | "riskTier"
  | "capability"
  | "verification"
>;

export type TaskDraft = Pick<TaskSpec, "type" | "title" | "owns" | "reads"> & {
  key: string;
};
