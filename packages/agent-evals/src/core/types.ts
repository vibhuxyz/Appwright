import type { AgentEvent, Runtime, StopReason } from "@repo/agent-core";

export interface ToolCallRecord {
  readonly name: string;
  readonly args: Readonly<Record<string, unknown>>;
  readonly isError: boolean;
  readonly errorMessage: string;
}

export interface RunTrace {
  readonly stopReason: StopReason;
  readonly toolCalls: readonly ToolCallRecord[];
  readonly events: readonly AgentEvent[];
  readonly finalText: string;
  readonly costUsd: number;
  readonly durationMs: number;
  readonly workspaceDir: string;
  readonly runtime: Runtime;
}

export interface GradeResult {
  readonly name: string;
  readonly passed: boolean;
  readonly detail: string;
}

export type Grader = (trace: RunTrace) => Promise<GradeResult>;

export interface EvalCase {
  readonly id: string;
  readonly template: string;
  readonly prompt: string;
  readonly graders: readonly Grader[];
  readonly tags: readonly string[];
}

export interface TrialResult {
  readonly caseId: string;
  readonly trial: number;
  readonly passed: boolean;
  readonly grades: readonly GradeResult[];
  readonly stopReason: StopReason;
  readonly toolCallCount: number;
  readonly costUsd: number;
  readonly durationMs: number;
  readonly crash?: string;
}
