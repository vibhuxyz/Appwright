import type { Plan } from "../plan";
import { estimatePlanCostCents } from "../validate";
import type { PlanContract } from "./schemas";

export function toPlanContract(plan: Plan): PlanContract {
  return {
    blueprint: plan.blueprint,
    tasks: plan.tasks,
    dependsOn: Object.fromEntries(plan.graph.dependsOn),
    levels: plan.graph.levels,
    ownershipConflicts: plan.graph.ownershipConflicts,
    warnings: plan.graph.warnings,
    estimatedCostCents: estimatePlanCostCents(plan.tasks),
  };
}
