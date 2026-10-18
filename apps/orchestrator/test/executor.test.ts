import { describe, expect, it } from "bun:test";
import type { TaskStatus } from "@repo/contracts";
import {
  executeRun,
  type AttemptInput,
  type AttemptOutcome,
  type AttemptRecord,
  type ExecutableTask,
  type ExecutorOptions,
  type ExecutorPorts,
  type VerifyOutcome,
} from "../src";

const OPTIONS: ExecutorOptions = {
  maxConcurrent: 2,
  maxAttemptsPerTask: 3,
  budgetCents: 1000,
  estimatedCostCents: 10,
  retryFailed: false,
};

function task(id: string, overrides: Partial<ExecutableTask> = {}): ExecutableTask {
  return {
    id,
    title: id,
    status: "pending",
    dependsOn: [],
    owns: [`src/${id}/**`],
    attemptsMade: 0,
    ...overrides,
  };
}

interface Harness {
  ports: ExecutorPorts;
  statuses: Map<string, TaskStatus>;
  records: AttemptRecord[];
  order: string[];
}

interface HarnessScript {
  attempt?: (input: AttemptInput) => AttemptOutcome | Promise<AttemptOutcome>;
  verify?: (task: ExecutableTask) => VerifyOutcome;
}

function harness(script: HarnessScript = {}): Harness {
  const statuses = new Map<string, TaskStatus>();
  const records: AttemptRecord[] = [];
  const order: string[] = [];
  let clock = 0;
  const ports: ExecutorPorts = {
    async runAttempt(input) {
      order.push(`${input.task.id}#${input.attemptNumber}`);
      return script.attempt?.(input) ?? { kind: "completed", costCents: 5 };
    },
    async verifyTask(target) {
      return script.verify?.(target) ?? { ok: true };
    },
    async setTaskStatus(taskId, status) {
      statuses.set(taskId, status);
    },
    async recordAttempt(record) {
      records.push(record);
    },
    now: () => (clock += 1),
  };
  return { ports, statuses, records, order };
}

const never = new AbortController().signal;

describe("executeRun", () => {
  it("runs a dependency chain in order and reports completed", async () => {
    const h = harness();
    const summary = await executeRun(
      [task("a"), task("b", { dependsOn: ["a"] })],
      h.ports,
      OPTIONS,
      never,
    );
    expect(summary.outcome).toBe("completed");
    expect(summary.done).toEqual(["a", "b"]);
    expect(h.order).toEqual(["a#1", "b#1"]);
    expect(summary.spentCents).toBe(10);
  });

  it("retries with the previous error in context, then succeeds", async () => {
    const seen: (string | undefined)[] = [];
    const h = harness({
      attempt: (input) => {
        seen.push(input.previousError);
        return input.attemptNumber < 2
          ? { kind: "failed", costCents: 1, error: "boom" }
          : { kind: "completed", costCents: 1 };
      },
    });
    const summary = await executeRun([task("a")], h.ports, OPTIONS, never);
    expect(summary.outcome).toBe("completed");
    expect(seen).toEqual([undefined, "boom"]);
    expect(h.records.map((r) => r.status)).toEqual(["failed", "succeeded"]);
  });

  it("is not green until verification passes", async () => {
    const h = harness({
      verify: () => ({ ok: false, error: "tsc: 2 errors" }),
    });
    const summary = await executeRun([task("a")], h.ports, OPTIONS, never);
    expect(summary.failed).toEqual(["a"]);
    expect(h.records).toHaveLength(3);
    expect(h.records[0]?.error).toBe("Verification failed: tsc: 2 errors");
  });

  it("blocks dependents of a failed task but continues independent ones", async () => {
    const h = harness({
      attempt: (input) =>
        input.task.id === "a"
          ? { kind: "failed", costCents: 1, error: "nope" }
          : { kind: "completed", costCents: 1 },
    });
    const summary = await executeRun(
      [task("a"), task("b", { dependsOn: ["a"] }), task("c", { dependsOn: ["b"] }), task("d")],
      h.ports,
      OPTIONS,
      never,
    );
    expect(summary.outcome).toBe("partial");
    expect(summary.failed).toEqual(["a"]);
    expect(summary.blocked).toEqual(["b", "c"]);
    expect(summary.done).toEqual(["d"]);
    expect(h.statuses.get("c")).toBe("blocked");
  });

  it("does not retry after a task budget is exceeded", async () => {
    const h = harness({ attempt: () => ({ kind: "budgetExceeded", costCents: 7 }) });
    const summary = await executeRun([task("a")], h.ports, OPTIONS, never);
    expect(summary.failed).toEqual(["a"]);
    expect(h.records).toHaveLength(1);
    expect(h.records[0]?.status).toBe("budgetExceeded");
  });

  it("stops dispatching when the run budget is exhausted", async () => {
    const h = harness({ attempt: () => ({ kind: "completed", costCents: 10 }) });
    const summary = await executeRun(
      [task("a"), task("b", { dependsOn: ["a"] })],
      h.ports,
      { ...OPTIONS, budgetCents: 15 },
      never,
    );
    expect(summary.outcome).toBe("budget_exhausted");
    expect(summary.done).toEqual(["a"]);
    expect(summary.unstarted).toEqual(["b"]);
  });

  it("resumes: done tasks are skipped, crashed running tasks restart, attempts continue", async () => {
    const h = harness();
    const summary = await executeRun(
      [
        task("a", { status: "done", attemptsMade: 1 }),
        task("b", { status: "running", dependsOn: ["a"], attemptsMade: 1 }),
      ],
      h.ports,
      OPTIONS,
      never,
    );
    expect(summary.outcome).toBe("completed");
    expect(h.order).toEqual(["b#2"]);
  });

  it("retryFailed re-attempts a previously failed task", async () => {
    const h = harness();
    const summary = await executeRun(
      [task("a", { status: "failed", attemptsMade: 3 })],
      h.ports,
      { ...OPTIONS, retryFailed: true },
      never,
    );
    expect(summary.done).toEqual(["a"]);
    expect(h.order).toEqual(["a#4"]);
  });

  it("cancels cleanly and leaves in-flight work resumable", async () => {
    const controller = new AbortController();
    const h = harness({
      attempt: () => {
        controller.abort();
        throw new DOMException("aborted", "AbortError");
      },
    });
    const summary = await executeRun(
      [task("a"), task("b", { dependsOn: ["a"] })],
      h.ports,
      OPTIONS,
      controller.signal,
    );
    expect(summary.outcome).toBe("cancelled");
    expect(h.statuses.get("a")).toBe("pending");
    expect(h.statuses.get("b")).toBeUndefined();
  });

  it("serialises overlapping ownership even with spare capacity", async () => {
    let active = 0;
    let peak = 0;
    const h = harness({
      attempt: async () => {
        active += 1;
        peak = Math.max(peak, active);
        await Bun.sleep(5);
        active -= 1;
        return { kind: "completed", costCents: 1 };
      },
    });
    await executeRun(
      [task("a", { owns: ["src/**"] }), task("b", { owns: ["src/auth/**"] })],
      h.ports,
      OPTIONS,
      never,
    );
    expect(peak).toBe(1);
  });

  it("runs independent tasks in parallel up to capacity", async () => {
    let active = 0;
    let peak = 0;
    const h = harness({
      attempt: async () => {
        active += 1;
        peak = Math.max(peak, active);
        await Bun.sleep(5);
        active -= 1;
        return { kind: "completed", costCents: 1 };
      },
    });
    await executeRun([task("a"), task("b"), task("c")], h.ports, OPTIONS, never);
    expect(peak).toBe(2);
  });
});
