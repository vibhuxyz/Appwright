import { describe, expect, it } from "bun:test";
import type { TaskStatus } from "@repo/contracts";
import {
  createWorkspaceVerifier,
  runPersistedRun,
  type AttemptRecord,
  type ExecutableTask,
  type GeneratedAttempt,
  type PostgresPortsConfig,
  type RunFinish,
  type RunStore,
  type TaskGenerator,
} from "../src";

const OPTIONS = {
  maxConcurrent: 2,
  maxAttemptsPerTask: 1,
  estimatedCostCents: 10,
  retryFailed: false,
};

function task(id: string): ExecutableTask {
  return {
    id,
    title: id,
    status: "pending",
    dependsOn: [],
    owns: [`src/${id}/**`],
    attemptsMade: 0,
  };
}

interface MemoryStore extends RunStore {
  statuses: Map<string, TaskStatus>;
  records: AttemptRecord[];
  finished: RunFinish[];
}

function memoryStore(tasks: ExecutableTask[]): MemoryStore {
  const statuses = new Map<string, TaskStatus>();
  const records: AttemptRecord[] = [];
  const finished: RunFinish[] = [];
  return {
    statuses,
    records,
    finished,
    async loadRun(runId) {
      return runId === "run-1"
        ? { id: runId, budgetCents: 500, spentCents: 100, tasks }
        : undefined;
    },
    async startRun() {},
    async setTaskStatus(taskId, status) {
      statuses.set(taskId, status);
    },
    async recordAttempt(_runId, record) {
      records.push(record);
    },
    async finishRun(_runId, finish) {
      finished.push(finish);
    },
  };
}

function config(
  store: RunStore,
  generate: () => GeneratedAttempt,
  isVerified = true,
): PostgresPortsConfig {
  const generator: TaskGenerator = { generate: async () => generate() };
  const verifier = createWorkspaceVerifier("/ws", async () => [
    { ok: isVerified, check: "tsc", errors: isVerified ? [] : [{ message: "bad type" }] },
  ]);
  return { runId: "run-1", store, generator, verifier, now: () => 0 };
}

describe("runPersistedRun", () => {
  it("reports an unknown run without touching the store", async () => {
    const store = memoryStore([]);
    const result = await runPersistedRun(
      { ...config(store, () => ({ kind: "completed", costCents: 1 })), runId: "nope" },
      OPTIONS,
      new AbortController().signal,
    );
    expect(result.found).toBe(false);
    expect(store.finished).toEqual([]);
  });

  it("persists status, attempts and a completed finish", async () => {
    const store = memoryStore([task("a")]);
    const result = await runPersistedRun(
      config(store, () => ({ kind: "completed", costCents: 5, writtenPaths: ["src/a/x.ts"] })),
      OPTIONS,
      new AbortController().signal,
    );
    expect(result.found && result.summary.outcome).toBe("completed");
    expect(store.statuses.get("a")).toBe("done");
    expect(store.records).toHaveLength(1);
    expect(store.finished[0]?.status).toBe("completed");
  });

  it("fails an attempt that writes outside the task's owned paths", async () => {
    const store = memoryStore([task("a")]);
    await runPersistedRun(
      config(store, () => ({ kind: "completed", costCents: 5, writtenPaths: ["src/other/x.ts"] })),
      OPTIONS,
      new AbortController().signal,
    );
    expect(store.statuses.get("a")).toBe("failed");
    expect(store.records[0]?.error).toContain("Write fence violated");
    expect(store.finished[0]?.status).toBe("failed");
  });

  it("fails a task whose verification is red", async () => {
    const store = memoryStore([task("a")]);
    await runPersistedRun(
      config(store, () => ({ kind: "completed", costCents: 5 }), false),
      OPTIONS,
      new AbortController().signal,
    );
    expect(store.statuses.get("a")).toBe("failed");
  });
});
