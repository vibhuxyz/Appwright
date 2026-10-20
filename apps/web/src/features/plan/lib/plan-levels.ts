import type { ContractTask, PlanContract } from "../schemas/plan-contract";

export interface PlanLevel {
  index: number;
  tasks: ContractTask[];
}

export function groupTasksByLevel(plan: Pick<PlanContract, "tasks" | "levels">): PlanLevel[] {
  const tasksById = new Map(plan.tasks.map((task) => [task.id, task]));
  return plan.levels.map((ids, index) => ({
    index,
    tasks: ids.flatMap((id) => tasksById.get(id) ?? []),
  }));
}

export function formatCostCents(cents: number): string {
  return COST_FORMAT.format(cents / CENTS_PER_DOLLAR);
}

const CENTS_PER_DOLLAR = 100;
const COST_FORMAT = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
