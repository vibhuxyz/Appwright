import type { Attachment, ProjectSpecification } from "@repo/contracts";

export interface MultimodalAnalysisInput {
  prompt: string;
  attachments?: readonly Attachment[];
  model?: string;
  signal?: AbortSignal;
}

export type MultimodalAnalysisErrorCode =
  | "PROVIDER_UNAVAILABLE"
  | "UNSUPPORTED_VISION"
  | "INVALID_SPECIFICATION"
  | "TIMEOUT"
  | "ANALYSIS_FAILED";

export interface MultimodalAnalysisError {
  code: MultimodalAnalysisErrorCode;
  message: string;
  details?: unknown;
}

export type MultimodalAnalysisResult =
  | { ok: true; specification: ProjectSpecification }
  | { ok: false; error: MultimodalAnalysisError };
