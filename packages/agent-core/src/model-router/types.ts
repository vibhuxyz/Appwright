import type { EffortLevel, PlanId } from "@repo/contracts";

export type AutoProfile = "ui" | "auth" | "integration" | "data" | "coding" | "testing" | "handoff";

export interface SelectModelInput {
  readonly mode: "auto" | "manual";
  readonly manualModel?: string;
  readonly profile: AutoProfile;
  readonly complexity?: number;
  readonly intent?: string;
  readonly confidence?: number;
  readonly effort?: EffortLevel;
  readonly plan: PlanId;
  readonly env?: NodeJS.Dict<string>;
}

export interface ResolveRunModelInput {
  readonly sessionModel: string;
  readonly plan: PlanId;
  readonly profile: AutoProfile;
  readonly complexity?: number;
  readonly intent?: string;
  readonly confidence?: number;
  readonly effort?: EffortLevel;
  readonly env?: NodeJS.Dict<string>;
}

export interface BudgetScale {
  readonly maxCostUsd: number;
  readonly maxIterations: number;
}
