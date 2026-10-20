import { workspaceRoot } from "@repo/contracts/files";
import { prisma } from "@repo/db";
import { verifyWorkspace } from "@repo/verify";
import {
  createPostgresPorts,
  createPrismaRunStore,
  createWorkspaceVerifier,
  executeRun,
  runBudgetCents,
  DEFAULT_MAX_ATTEMPTS_PER_TASK,
  DEFAULT_MAX_CONCURRENT_TASKS,
  type RunSummary,
} from "orchestrator";
import { log } from "../log";
import { createRunTaskGenerator } from "./run-task-generator";

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
}

export async function executeBlueprintRun(
  options: ExecuteBlueprintRunOptions,
  signal: AbortSignal,
): Promise<RunSummary | undefined> {
  const { runId, sessionId, projectId, model, userRemainingCents } = options;
  const store = createPrismaRunStore({ client: prisma, modelName: model, now: () => Date.now() });
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

  const generator = createRunTaskGenerator({ projectId, sessionId, model });
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
