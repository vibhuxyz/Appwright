import { describe, expect, it } from "bun:test";
import { runBudgetCents, taskBudgetCents } from "../src";

const LEVELS = { userRemainingCents: 500, runCapCents: 300, runSpentCents: 100, taskCapCents: 80 };

describe("nested budgets", () => {
  it("run budget is the tighter of user remaining and run remaining", () => {
    expect(runBudgetCents(LEVELS)).toBe(200);
    expect(runBudgetCents({ ...LEVELS, userRemainingCents: 50 })).toBe(50);
  });

  it("never goes negative", () => {
    expect(runBudgetCents({ ...LEVELS, runSpentCents: 900 })).toBe(0);
  });

  it("task budget is capped by the run budget", () => {
    expect(taskBudgetCents(LEVELS)).toBe(80);
    expect(taskBudgetCents({ ...LEVELS, taskCapCents: 999 })).toBe(200);
  });
});
