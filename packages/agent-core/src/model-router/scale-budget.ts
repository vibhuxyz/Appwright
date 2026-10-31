import type { EffortLevel } from "@repo/contracts";
import {
  HIGH_COST_FACTOR,
  HIGH_ITERATION_FACTOR,
  LOW_COST_FACTOR,
  LOW_ITERATION_FACTOR,
  MIN_SCALED_ITERATIONS,
} from "./constants";
import type { BudgetScale } from "./types";

export function scaleBudget(base: BudgetScale, effort: EffortLevel = "medium"): BudgetScale {
  if (effort === "low") {
    return {
      maxCostUsd: base.maxCostUsd * LOW_COST_FACTOR,
      maxIterations: Math.max(MIN_SCALED_ITERATIONS, Math.floor(base.maxIterations * LOW_ITERATION_FACTOR)),
    };
  }
  if (effort === "high") {
    return {
      maxCostUsd: base.maxCostUsd * HIGH_COST_FACTOR,
      maxIterations: Math.floor(base.maxIterations * HIGH_ITERATION_FACTOR),
    };
  }
  return base;
}
