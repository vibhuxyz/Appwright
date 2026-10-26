export function computeWaitBudgetMs(input: {
  limitMs: number;
  deadlineAt: number;
  now: number;
  safetyMarginMs: number;
  minimumWaitMs: number;
}): number {
  const availableMs = input.deadlineAt - input.now - input.safetyMarginMs;
  const budgetMs = Math.min(input.limitMs, availableMs);
  return budgetMs >= input.minimumWaitMs ? budgetMs : 0;
}
