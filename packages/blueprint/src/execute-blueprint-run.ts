import type { EffortLevel, PlanId } from "@repo/contracts";
import { workspaceRoot } from "@repo/contracts/files";
import { prisma } from "@repo/db";
import { createLogger } from "@repo/logger";
import { verifyWorkspace } from "@repo/verify";
import type { AgentEventSink, Runtime, Tool } from "@repo/agent-core";
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
  worktreeSessionId: string;
  projectId: string;
  model: string;
  plan: PlanId;
  userRemainingCents: number;
  runtime: Runtime;
  onTaskStatus?: (taskId: string, status: string) => void;
  conversationEmit?: AgentEventSink;
  extraTools?: readonly Tool[];
  complexity?: number;
  confidence?: number;
  intent?: string;
  effort?: EffortLevel;
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
  const {
    runId,
    sessionId,
    worktreeSessionId,
    projectId,
    model,
    plan,
    userRemainingCents,
    runtime,
    onTaskStatus,
    conversationEmit,
  } = options;
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

  const generator = createRunTaskGenerator({
    sessionId,
    model,
    plan,
    runtime,
    conversationEmit,
    extraTools: options.extraTools,
    ...(options.complexity !== undefined ? { complexity: options.complexity } : {}),
    ...(options.confidence !== undefined ? { confidence: options.confidence } : {}),
    ...(options.intent !== undefined ? { intent: options.intent } : {}),
    ...(options.effort !== undefined ? { effort: options.effort } : {}),
  });
  const workspaceDir = workspaceRoot(projectId, worktreeSessionId);
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
