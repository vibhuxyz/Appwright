import type { ExecutorPorts } from "../types";
import { runFencedAttempt } from "./fenced-attempt";
import type { RunStore, TaskGenerator, WorkspaceVerifier } from "./types";
import { toVerifyOutcome } from "./verify-task";

export interface PostgresPortsConfig {
  runId: string;
  store: RunStore;
  generator: TaskGenerator;
  verifier: WorkspaceVerifier;
  now(): number;
}

export function createPostgresPorts(config: PostgresPortsConfig): ExecutorPorts {
  const { runId, store, generator, verifier, now } = config;
  return {
    runAttempt: (input) => runFencedAttempt(generator, input),
    verifyTask: async (task, signal) => toVerifyOutcome(await verifier(task, signal)),
    setTaskStatus: (taskId, status) => store.setTaskStatus(taskId, status),
    recordAttempt: (record) => store.recordAttempt(runId, record),
    now,
  };
}
