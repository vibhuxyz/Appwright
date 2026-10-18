import type { TaskStatus } from "@repo/contracts";
import type { SchedulableTask, WaitingTask } from "../scheduler";

export interface ExecutableTask extends SchedulableTask {
  title: string;
  attemptsMade: number;
}

export interface AttemptInput {
  task: ExecutableTask;
  attemptNumber: number;
  previousError: string | undefined;
  signal: AbortSignal;
}

export type AttemptOutcome =
  | { kind: "completed"; costCents: number; commitSha?: string | undefined }
  | { kind: "failed"; costCents: number; error: string }
  | { kind: "budgetExceeded"; costCents: number };

export type VerifyOutcome = { ok: true } | { ok: false; error: string };

export type AttemptStatus =
  | "succeeded"
  | "failed"
  | "budgetExceeded"
  | "cancelled";

export interface AttemptRecord {
  taskId: string;
  attemptNumber: number;
  status: AttemptStatus;
  costCents: number;
  durationMs: number;
  error?: string | undefined;
  commitSha?: string | undefined;
}

export interface ExecutorPorts {
  runAttempt(input: AttemptInput): Promise<AttemptOutcome>;
  verifyTask(task: ExecutableTask, signal: AbortSignal): Promise<VerifyOutcome>;
  setTaskStatus(taskId: string, status: TaskStatus): Promise<void>;
  recordAttempt(record: AttemptRecord): Promise<void>;
  now(): number;
}

export interface ExecutorOptions {
  maxConcurrent: number;
  maxAttemptsPerTask: number;
  budgetCents: number;
  estimatedCostCents: number;
  retryFailed: boolean;
}

export type RunOutcome =
  | "completed"
  | "partial"
  | "cancelled"
  | "budget_exhausted";

export interface RunSummary {
  outcome: RunOutcome;
  done: string[];
  failed: string[];
  blocked: string[];
  unstarted: string[];
  spentCents: number;
  waiting: WaitingTask[];
}

export type TaskResult =
  | { status: "done"; spentCents: number; attemptsMade: number }
  | { status: "failed"; spentCents: number; attemptsMade: number; reason: string }
  | { status: "cancelled"; spentCents: number; attemptsMade: number };
