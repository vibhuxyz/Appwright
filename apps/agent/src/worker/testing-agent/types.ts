import type { AgentEventSink, Message, Provider, Runtime } from "@repo/agent-core";
import type { VerificationResult } from "@repo/contracts";
import type { PersistFields } from "../persist";

export interface TestingEvidence {
  readonly verification: readonly string[];
  readonly routes: readonly string[];
  readonly changedPaths: readonly string[];
  readonly findings: readonly string[];
  readonly visualNotes: readonly string[];
}

export interface TestingReview {
  readonly status: "pass" | "fail";
  readonly notes: string;
  readonly mustFix: readonly string[];
}

export interface RepairDecision {
  readonly status: "pass" | "fail";
  readonly mustFix: readonly string[];
}

export interface ReviewInput {
  readonly projectId: string;
  readonly sessionId: string;
  readonly userId: string;
  readonly worktreeDir: string;
  readonly verifyResults: readonly VerificationResult[];
  readonly sessionModel: string;
  readonly provider?: Provider;
  readonly runtime: Runtime & { flush(): Promise<void> };
  readonly emit: AgentEventSink;
  readonly signal: AbortSignal;
  readonly persist: (fields: PersistFields) => Promise<unknown>;
  readonly messages: Message[];
  readonly browserEnabled?: boolean;
  readonly publish?: (detail: string) => void;
  readonly repairTurn?: (prompt: string) => Promise<boolean>;
}
