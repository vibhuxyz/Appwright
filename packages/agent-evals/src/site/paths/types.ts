import type { Provider, Runtime } from "@repo/agent-core";
import type { Plan } from "@repo/planner";

export interface PathContext {
  readonly plan: Plan;
  readonly projectId: string;
  readonly workspaceDir: string;
  readonly runtime: Runtime;
  readonly provider: Provider;
  readonly signal: AbortSignal;
  readonly generationCapUsd: number;
}

export interface ToolCallSummary {
  readonly name: string;
  readonly isError: boolean;
}

export interface PathOutcome {
  readonly stopReason: string;
  readonly toolCalls: readonly ToolCallSummary[];
  readonly errors: readonly string[];
  readonly deliveredFiles: readonly string[];
  readonly deliverySkipped: readonly { readonly id: string; readonly reason: string }[];
  readonly taskSummary?: {
    readonly outcome: string;
    readonly done: readonly string[];
    readonly failed: readonly string[];
    readonly blocked: readonly string[];
    readonly unstarted: readonly string[];
  };
  readonly attempts?: readonly { readonly taskId: string; readonly status: string; readonly costCents: number; readonly durationMs: number; readonly error: string | undefined }[];
}
