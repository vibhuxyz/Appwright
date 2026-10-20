import type { VerificationResult } from "@repo/contracts";
import type { WriteFence } from "@repo/planner";
import type { AttemptInput, AttemptOutcome, AttemptRecord, ExecutableTask } from "../types";

export interface StoredRun {
  id: string;
  budgetCents: number;
  spentCents: number;
  tasks: ExecutableTask[];
}

export type RunFinalStatus = "completed" | "failed" | "cancelled" | "paused";

export interface RunFinish {
  status: RunFinalStatus;
  error?: string | undefined;
}

export interface RunStore {
  loadRun(runId: string): Promise<StoredRun | undefined>;
  startRun(runId: string): Promise<void>;
  setTaskStatus(taskId: string, status: ExecutableTask["status"]): Promise<void>;
  recordAttempt(runId: string, record: AttemptRecord): Promise<void>;
  finishRun(runId: string, finish: RunFinish): Promise<void>;
}

export interface FencedAttemptInput extends AttemptInput {
  fence: WriteFence;
}

export type GeneratedAttempt = AttemptOutcome & {
  writtenPaths?: readonly string[] | undefined;
};

export interface TaskGenerator {
  generate(input: FencedAttemptInput): Promise<GeneratedAttempt>;
}

export type WorkspaceVerifier = (
  task: ExecutableTask,
  signal: AbortSignal,
) => Promise<readonly VerificationResult[]>;
