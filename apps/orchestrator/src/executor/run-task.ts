import { VERIFICATION_FAILED_PREFIX } from "./constants";
import type {
  AttemptOutcome,
  AttemptRecord,
  ExecutableTask,
  ExecutorOptions,
  ExecutorPorts,
  TaskResult,
} from "./types";

interface AttemptContext {
  task: ExecutableTask;
  ports: ExecutorPorts;
  signal: AbortSignal;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

async function runAttemptSafely(
  context: AttemptContext,
  attemptNumber: number,
  previousError: string | undefined,
): Promise<AttemptOutcome | "aborted"> {
  const { task, ports, signal } = context;
  try {
    return await ports.runAttempt({ task, attemptNumber, previousError, signal });
  } catch (error) {
    if (signal.aborted || isAbortError(error)) return "aborted";
    const message = error instanceof Error ? error.message : String(error);
    return { kind: "failed", costCents: 0, error: `Attempt crashed: ${message}` };
  }
}

async function verifyOutcome(
  context: AttemptContext,
  outcome: AttemptOutcome,
): Promise<AttemptOutcome> {
  if (outcome.kind !== "completed") return outcome;
  const verdict = await context.ports.verifyTask(context.task, context.signal);
  if (verdict.ok) return outcome;
  return {
    kind: "failed",
    costCents: outcome.costCents,
    error: `${VERIFICATION_FAILED_PREFIX}${verdict.error}`,
  };
}

function toRecord(
  taskId: string,
  attemptNumber: number,
  outcome: AttemptOutcome | "aborted",
  durationMs: number,
): AttemptRecord {
  if (outcome === "aborted") {
    return { taskId, attemptNumber, status: "cancelled", costCents: 0, durationMs };
  }
  switch (outcome.kind) {
    case "completed":
      return {
        taskId,
        attemptNumber,
        status: "succeeded",
        costCents: outcome.costCents,
        durationMs,
        commitSha: outcome.commitSha,
      };
    case "failed":
      return {
        taskId,
        attemptNumber,
        status: "failed",
        costCents: outcome.costCents,
        durationMs,
        error: outcome.error,
      };
    case "budgetExceeded":
      return {
        taskId,
        attemptNumber,
        status: "budgetExceeded",
        costCents: outcome.costCents,
        durationMs,
        error: "Task budget exceeded",
      };
    default: {
      const unreachable: never = outcome;
      return unreachable;
    }
  }
}

export async function runTaskWithRetries(
  task: ExecutableTask,
  ports: ExecutorPorts,
  options: Pick<ExecutorOptions, "maxAttemptsPerTask">,
  signal: AbortSignal,
): Promise<TaskResult> {
  const context: AttemptContext = { task, ports, signal };
  let spentCents = 0;
  let previousError: string | undefined;
  let attemptsMade = task.attemptsMade;

  for (let index = 0; index < options.maxAttemptsPerTask; index++) {
    attemptsMade += 1;
    const startedAt = ports.now();
    const raw = await runAttemptSafely(context, attemptsMade, previousError);
    const outcome = raw === "aborted" ? raw : await verifyOutcome(context, raw);
    const record = toRecord(task.id, attemptsMade, outcome, ports.now() - startedAt);
    await ports.recordAttempt(record);
    spentCents += record.costCents;

    if (record.status === "succeeded") return { status: "done", spentCents, attemptsMade };
    if (record.status === "cancelled") return { status: "cancelled", spentCents, attemptsMade };
    previousError = record.error;
    if (record.status === "budgetExceeded") break;
  }
  return {
    status: "failed",
    spentCents,
    attemptsMade,
    reason: previousError ?? "Task failed",
  };
}
