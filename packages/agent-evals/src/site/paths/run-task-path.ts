import { buildTaskDetail, createRunTaskGenerator, type TaskDetail } from "@repo/blueprint";
import { generateDependencyManifest } from "@repo/planner";
import { runTsc } from "@repo/verify";
import {
  DEFAULT_MAX_ATTEMPTS_PER_TASK,
  DEFAULT_MAX_CONCURRENT_TASKS,
  createPostgresPorts,
  executeRun,
  type ExecutableTask,
} from "orchestrator";
import { createTraceCollector } from "../../runner";
import { SITE_TEMPLATE, TASK_MAX_ATTEMPTS, TASK_RUN_DEADLINE_MS } from "../constants";
import { StubRunStore } from "./stub-run-store";
import type { PathContext, PathOutcome } from "./types";

const CENTS_PER_USD = 100;
const FINAL_VERIFY_SESSION = "site-eval";

function executableTasks(context: PathContext): ExecutableTask[] {
  const { plan } = context;
  return plan.tasks.map((task) => ({
    id: task.id,
    status: "pending",
    dependsOn: plan.graph.dependsOn.get(task.id) ?? [],
    owns: task.owns,
    title: task.title,
    attemptsMade: 0,
  }));
}

function detailLoader(context: PathContext): (taskId: string) => Promise<TaskDetail> {
  const { plan, projectId } = context;
  const { blueprint } = plan;
  const specById = new Map(plan.tasks.map((task) => [task.id, task]));
  const manifest = generateDependencyManifest({ projectId, blueprint, templateId: SITE_TEMPLATE });
  return async (taskId) => {
    const task = specById.get(taskId);
    if (!task) throw new Error(`Unknown task ${taskId} in the stub task store`);
    return buildTaskDetail({
      projectId,
      task,
      blueprint: { ...blueprint, requirements: blueprint.requirements ?? [], dependencyManifest: manifest, specification: undefined },
      assetSlotLists: [],
    });
  };
}

export async function runTaskPath(context: PathContext): Promise<PathOutcome> {
  const { workspaceDir, runtime, provider, signal } = context;
  const collector = createTraceCollector();
  const store = new StubRunStore();
  const generator = createRunTaskGenerator({
    sessionId: FINAL_VERIFY_SESSION,
    model: provider.model,
    plan: "PRO",
    runtime,
    providers: [provider],
    loadDetail: detailLoader(context),
    conversationEmit: collector.sink,
  });
  const ports = createPostgresPorts({
    runId: `${context.projectId}-run`,
    store,
    generator,
    verifier: async () => [await runTsc(workspaceDir)],
    now: Date.now,
  });
  const deadline = AbortSignal.timeout(TASK_RUN_DEADLINE_MS);
  const summary = await executeRun(
    executableTasks(context),
    ports,
    {
      maxConcurrent: DEFAULT_MAX_CONCURRENT_TASKS,
      maxAttemptsPerTask: context.repair === "production" ? DEFAULT_MAX_ATTEMPTS_PER_TASK : TASK_MAX_ATTEMPTS,
      budgetCents: Math.ceil(context.generationCapUsd * CENTS_PER_USD),
      estimatedCostCents: 0,
      retryFailed: false,
    },
    AbortSignal.any([signal, deadline]),
  );
  const attemptedTaskIds = new Set(store.attempts.map((attempt) => attempt.taskId));
  return {
    stopReason: summary.outcome,
    repairRounds: store.attempts.length - attemptedTaskIds.size,
    toolCalls: collector.toolCalls().map((call) => ({ name: call.name, isError: call.isError })),
    errors: collector.events.flatMap((event) => (event.type === "error" ? [event.message] : [])),
    deliveredFiles: [],
    deliverySkipped: [],
    taskSummary: { outcome: summary.outcome, done: summary.done, failed: summary.failed, blocked: summary.blocked, unstarted: summary.unstarted },
    attempts: store.attempts.map((attempt) => ({ taskId: attempt.taskId, status: attempt.status, costCents: attempt.costCents, durationMs: attempt.durationMs, error: attempt.error })),
  };
}
