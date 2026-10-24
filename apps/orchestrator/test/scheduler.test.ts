import { describe, expect, it } from "bun:test";
import {
  describeWait,
  selectNextTasks,
  type SchedulableTask,
  type SchedulerCapacity,
} from "../src";

const ROOMY: SchedulerCapacity = {
  maxConcurrent: 4,
  budgetRemainingCents: 1000,
  estimatedCostCents: 10,
};

function task(
  id: string,
  overrides: Partial<SchedulableTask> = {},
): SchedulableTask {
  return { id, status: "pending", dependsOn: [], owns: [`src/${id}/**`], ...overrides };
}

describe("scheduler", () => {
  it("dispatches independent tasks together", () => {
    const decision = selectNextTasks([task("a"), task("b")], ROOMY);
    expect(decision.dispatch).toEqual(["a", "b"]);
    expect(decision.waiting).toEqual([]);
  });

  it("waits on unfinished dependencies and names them", () => {
    const decision = selectNextTasks(
      [task("a"), task("b", { dependsOn: ["a"] })],
      ROOMY,
    );
    expect(decision.dispatch).toEqual(["a"]);
    expect(decision.waiting[0]?.reason).toEqual({ kind: "dependency", blockedOn: ["a"] });
  });

  it("serialises overlapping ownership", () => {
    const decision = selectNextTasks(
      [task("a", { owns: ["src/**"] }), task("b", { owns: ["src/auth/**"] })],
      ROOMY,
    );
    expect(decision.dispatch).toEqual(["a"]);
    expect(decision.waiting[0]?.reason).toEqual({ kind: "ownership", conflictsWith: "a" });
  });

  it("serialises tasks sharing a non-file resource", () => {
    const decision = selectNextTasks(
      [task("a", { owns: ["db:app"] }), task("b", { owns: ["db:app"] })],
      ROOMY,
    );
    expect(decision.dispatch).toEqual(["a"]);
  });

  it("respects capacity counting already-running tasks", () => {
    const decision = selectNextTasks(
      [task("r", { status: "running" }), task("a"), task("b")],
      { ...ROOMY, maxConcurrent: 2 },
    );
    expect(decision.dispatch).toEqual(["a"]);
    expect(decision.waiting[0]?.reason.kind).toBe("capacity");
  });

  it("stops dispatching when the budget runs out", () => {
    const decision = selectNextTasks([task("a"), task("b")], {
      ...ROOMY,
      budgetRemainingCents: 10,
    });
    expect(decision.dispatch).toEqual(["a"]);
    expect(decision.waiting[0]?.reason.kind).toBe("budget");
  });

  it("reports a failed upstream distinctly from a pending one", () => {
    const decision = selectNextTasks(
      [task("a", { status: "failed" }), task("b", { dependsOn: ["a"] })],
      ROOMY,
    );
    expect(decision.waiting[0]?.reason.kind).toBe("upstream_failed");
    expect(describeWait(decision.waiting[0]!.reason)).toContain("upstream failed: a");
  });

  it("dispatches in plan order when multiple tasks are ready", () => {
    const decision = selectNextTasks(
      [task("theme"), task("security"), task("media")],
      { ...ROOMY, maxConcurrent: 2 },
    );
    expect(decision.dispatch).toEqual(["theme", "security"]);
    expect(decision.waiting[0]?.reason.kind).toBe("capacity");
  });
});
