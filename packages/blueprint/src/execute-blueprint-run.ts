import { workspaceRoot } from "@repo/contracts/files";
import { prisma } from "@repo/db";
import { createLogger } from "@repo/logger";
import { verifyWorkspace } from "@repo/verify";
import type { Runtime } from "@repo/agent-core";
import {
  createPostgresPorts,
  createPrismaRunStore,
  createWorkspaceVerifier,
  executeRun,
  runBudgetCents,
  DEFAULT_MAX_ATTEMPTS_PER_TASK,
  DEFAULT_MAX_CONCURRENT_TASKS,
  type RunStore,
  type RunSummary,
} from "orchestrator";
import { createRunTaskGenerator } from "./run-task-generator";

const log = createLogger("blueprint");

const RUN_FINAL_STATUS_BY_OUTCOME = {
  completed: "completed",
  partial: "failed",
  cancelled: "cancelled",
  budget_exhausted: "paused",
} as const;

export interface ExecuteBlueprintRunOptions {
  runId: string;
  sessionId: string;
  projectId: string;
  model: string;
  userRemainingCents: number;
  runtime: Runtime;
  onTaskStatus?: (taskId: string, status: string) => void;
}

function withTaskStatusNotifications(
  store: RunStore,
  onTaskStatus: (taskId: string, status: string) => void,
): RunStore {
  return {
    ...store,
    setTaskStatus: (taskId, status) => {
      onTaskStatus(taskId, status);
      return store.setTaskStatus(taskId, status);
    },
  };
}

export async function executeBlueprintRun(
  options: ExecuteBlueprintRunOptions,
  signal: AbortSignal,
): Promise<RunSummary | undefined> {
  const { runId, sessionId, projectId, model, userRemainingCents, runtime, onTaskStatus } = options;
  const baseStore = createPrismaRunStore({ client: prisma, modelName: model, now: () => Date.now() });
  const store = onTaskStatus ? withTaskStatusNotifications(baseStore, onTaskStatus) : baseStore;
  const run = await store.loadRun(runId);
  if (!run) {
    log.error("blueprint run not found at execution time", { runId });
    return undefined;
  }

  await store.startRun(runId);
  const budgetCents = runBudgetCents({
    userRemainingCents,
    runCapCents: run.budgetCents,
    runSpentCents: run.spentCents,
  });

  const generator = createRunTaskGenerator({ sessionId, model, runtime });
  const workspaceDir = workspaceRoot(projectId, sessionId);
  const verifier = createWorkspaceVerifier(workspaceDir, verifyWorkspace);
  const ports = createPostgresPorts({ runId, store, generator, verifier, now: () => Date.now() });

  const summary = await executeRun(
    run.tasks,
    ports,
    {
      maxConcurrent: DEFAULT_MAX_CONCURRENT_TASKS,
      maxAttemptsPerTask: DEFAULT_MAX_ATTEMPTS_PER_TASK,
      budgetCents,
      estimatedCostCents: 0,
      retryFailed: true,
    },
    signal,
  );

  await store.finishRun(runId, { status: RUN_FINAL_STATUS_BY_OUTCOME[summary.outcome] });
  return summary;
}
