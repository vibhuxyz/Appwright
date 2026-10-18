import { selectNextTasks, type SchedulerDecision, type WaitingTask } from "../scheduler";
import { runTaskWithRetries } from "./run-task";
import { summarize } from "./summarize";
import { initialStates, toSchedulable, type TaskState } from "./task-state";
import type {
  ExecutableTask,
  ExecutorOptions,
  ExecutorPorts,
  RunSummary,
  TaskResult,
} from "./types";

interface Settled {
  taskId: string;
  result: TaskResult;
}

interface RunContext {
  tasks: readonly ExecutableTask[];
  tasksById: ReadonlyMap<string, ExecutableTask>;
  states: Map<string, TaskState>;
  inflight: Map<string, Promise<Settled>>;
  ports: ExecutorPorts;
  options: ExecutorOptions;
  signal: AbortSignal;
  spentCents: number;
}

async function persistResumedStatuses(context: RunContext): Promise<void> {
  const { tasks, states, ports } = context;
  const changed = tasks.filter((task) => states.get(task.id)?.status !== task.status);
  await Promise.all(
    changed.map((task) => ports.setTaskStatus(task.id, states.get(task.id)?.status ?? "pending")),
  );
}

async function markBlocked(
  context: RunContext,
  waiting: readonly WaitingTask[],
): Promise<number> {
  const upstreamFailed = waiting.filter((entry) => entry.reason.kind === "upstream_failed");
  for (const entry of upstreamFailed) {
    const state = context.states.get(entry.taskId);
    if (state) state.status = "blocked";
  }
  await Promise.all(
    upstreamFailed.map((entry) => context.ports.setTaskStatus(entry.taskId, "blocked")),
  );
  return upstreamFailed.length;
}

function statusAfter(result: TaskResult): "done" | "failed" | "pending" {
  return result.status === "cancelled" ? "pending" : result.status;
}

async function startTask(context: RunContext, taskId: string): Promise<void> {
  const task = context.tasksById.get(taskId);
  const state = context.states.get(taskId);
  if (!task || !state) return;
  state.status = "running";
  await context.ports.setTaskStatus(taskId, "running");
  const runnable = { ...task, attemptsMade: state.attemptsMade };
  context.inflight.set(
    taskId,
    runTaskWithRetries(runnable, context.ports, context.options, context.signal).then(
      (result) => ({ taskId, result }),
    ),
  );
}

async function settleTask(context: RunContext, { taskId, result }: Settled): Promise<void> {
  context.inflight.delete(taskId);
  context.spentCents += result.spentCents;
  const state = context.states.get(taskId);
  if (state) {
    state.status = statusAfter(result);
    state.attemptsMade = result.attemptsMade;
  }
  await context.ports.setTaskStatus(taskId, statusAfter(result));
}

function decide(context: RunContext): SchedulerDecision {
  const { options, inflight, spentCents } = context;
  return selectNextTasks(toSchedulable(context.tasks, context.states), {
    maxConcurrent: options.maxConcurrent,
    estimatedCostCents: options.estimatedCostCents,
    budgetRemainingCents:
      options.budgetCents - spentCents - inflight.size * options.estimatedCostCents,
  });
}

async function dispatchLoop(context: RunContext): Promise<SchedulerDecision> {
  let decision: SchedulerDecision = { dispatch: [], waiting: [] };
  while (!context.signal.aborted) {
    decision = decide(context);
    const newlyBlocked = await markBlocked(context, decision.waiting);
    await Promise.all(decision.dispatch.map((taskId) => startTask(context, taskId)));
    if (context.inflight.size === 0 && newlyBlocked > 0) continue;
    if (context.inflight.size === 0) break;
    await settleTask(context, await Promise.race(context.inflight.values()));
  }
  return decision;
}

export async function executeRun(
  tasks: readonly ExecutableTask[],
  ports: ExecutorPorts,
  options: ExecutorOptions,
  signal: AbortSignal,
): Promise<RunSummary> {
  const context: RunContext = {
    tasks,
    tasksById: new Map(tasks.map((task) => [task.id, task])),
    states: initialStates(tasks, options.retryFailed),
    inflight: new Map(),
    ports,
    options,
    signal,
    spentCents: 0,
  };
  await persistResumedStatuses(context);
  const decision = await dispatchLoop(context);
  for (const settled of await Promise.all(context.inflight.values())) {
    await settleTask(context, settled);
  }
  const waiting = decision.waiting.filter(
    (entry) => context.states.get(entry.taskId)?.status === "pending",
  );
  return summarize({
    tasks,
    states: context.states,
    waiting,
    spentCents: context.spentCents,
    wasCancelled: signal.aborted,
  });
}
