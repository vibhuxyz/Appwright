export interface BudgetLevels {
  userRemainingCents: number;
  runCapCents: number;
  runSpentCents: number;
  taskCapCents: number;
}

export function runBudgetCents(
  levels: Pick<BudgetLevels, "userRemainingCents" | "runCapCents" | "runSpentCents">,
): number {
  const runRemaining = levels.runCapCents - levels.runSpentCents;
  return Math.max(0, Math.min(levels.userRemainingCents, runRemaining));
}

export function taskBudgetCents(levels: BudgetLevels): number {
  return Math.min(runBudgetCents(levels), Math.max(0, levels.taskCapCents));
}
