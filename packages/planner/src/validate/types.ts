import type { PlanIssue } from "../shared";

export interface ValidatedGraph {
  dependsOn: Map<string, string[]>;
  levels: string[][];
  ownershipConflicts: [string, string][];
  warnings: PlanIssue[];
}
