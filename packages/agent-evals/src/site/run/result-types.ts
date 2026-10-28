import type { Finding, PageShot } from "@repo/browser";
import type { VerificationResult } from "@repo/contracts";
import type { MissingImport } from "../capture";
import type { PathOutcome } from "../paths";
import type { GroupConfig, SpendEntry } from "../types";

export type FailureKind = "budget" | "generation" | "missing-imports" | "app-failed";

export interface PromptRecord {
  readonly role: string;
  readonly text: string;
}

export interface GenerationResult {
  readonly runId: string;
  readonly label: string;
  readonly briefId: string;
  readonly config: GroupConfig;
  readonly model: { readonly id: string; readonly usdPerMillionInput: number; readonly usdPerMillionOutput: number };
  readonly status: "succeeded" | "failed";
  readonly failure?: { readonly kind: FailureKind; readonly message: string };
  readonly costUsd: number;
  readonly tokens: { readonly input: number; readonly output: number; readonly cachedInput: number; readonly calls: number };
  readonly durationMs: number;
  readonly path: PathOutcome;
  readonly tsc: readonly VerificationResult[];
  readonly build: VerificationResult;
  readonly missingImports: readonly MissingImport[];
  readonly shots: readonly PageShot[];
  readonly findings: readonly Finding[];
  readonly spend: readonly SpendEntry[];
  readonly sourceFileCount: number;
  readonly prompts: readonly PromptRecord[];
  readonly transportRetries: readonly { readonly attempt: number; readonly reason: string }[];
}
