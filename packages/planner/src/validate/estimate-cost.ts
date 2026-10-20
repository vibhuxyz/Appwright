import type { Capability } from "@repo/contracts";
import type { TaskSpec } from "../compile";
import type { PlanIssue } from "../shared";

const PLACEHOLDER_COST_CENTS_BY_CAPABILITY: Record<Capability, number> = {
  strong_reasoning: 150,
  strong_coding: 80,
  fast_coding: 40,
  cheap: 10,
};

export function estimatePlanCostCents(tasks: readonly TaskSpec[]): number {
  return tasks.reduce(
    (total, task) =>
      total + PLACEHOLDER_COST_CENTS_BY_CAPABILITY[task.capability],
    0,
  );
}

export function budgetIssue(
  tasks: readonly TaskSpec[],
  budgetCents: number,
): PlanIssue | undefined {
  const estimatedCents = estimatePlanCostCents(tasks);
  if (estimatedCents <= budgetCents) return undefined;
  return {
    code: "over_budget",
    message: `Estimated cost ${estimatedCents}c exceeds the run budget of ${budgetCents}c`,
  };
}
