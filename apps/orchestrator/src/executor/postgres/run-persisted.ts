import { runBudgetCents } from "../../budget";
import { executeRun } from "../execute-run";
import type { ExecutorOptions, RunOutcome, RunSummary } from "../types";
import { createPostgresPorts, type PostgresPortsConfig } from "./create-ports";
import type { RunFinalStatus } from "./types";

export type PersistedRunOptions = Omit<ExecutorOptions, "budgetCents"> & {
  userRemainingCents?: number | undefined;
};

export type PersistedRunResult =
  | { found: true; summary: RunSummary }
  | { found: false; reason: string };

const FINAL_STATUS_BY_OUTCOME = {
  completed: "completed",
  partial: "failed",
  cancelled: "cancelled",
  budget_exhausted: "paused",
} as const satisfies Record<RunOutcome, RunFinalStatus>;

export async function runPersistedRun(
  config: PostgresPortsConfig,
  options: PersistedRunOptions,
  signal: AbortSignal,
): Promise<PersistedRunResult> {
  const { runId, store } = config;
  const run = await store.loadRun(runId);
  if (!run) return { found: false, reason: `Run ${runId} or its blueprint tasks not found` };
  await store.startRun(runId);
  const { userRemainingCents = Number.POSITIVE_INFINITY, ...executorOptions } = options;
  const budgetCents = runBudgetCents({
    userRemainingCents,
    runCapCents: run.budgetCents,
    runSpentCents: run.spentCents,
  });
  const summary = await executeRun(run.tasks, createPostgresPorts(config), { ...executorOptions, budgetCents }, signal);
  await store.finishRun(runId, { status: FINAL_STATUS_BY_OUTCOME[summary.outcome] });
  return { found: true, summary };
}
