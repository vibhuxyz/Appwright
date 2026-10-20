import { z } from "zod";
import type { Task } from "@repo/contracts";
import type { ModelResolution } from "../capability";
import type { Provider } from "../providers/types";

export const GeneratedFileSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
});
export const GeneratedFilesSchema = z.array(GeneratedFileSchema);
export type GeneratedFile = z.infer<typeof GeneratedFileSchema>;

export interface PathFence {
  check(
    path: string,
  ): { allowed: true; path: string } | { allowed: false; path: string; reason: string };
}

export interface RejectedFile {
  path: string;
  reason: string;
}

export interface GenerationUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface GenerateForTaskOptions {
  task: Task;
  contextText: string;
  fence: PathFence;
  resolution: ModelResolution;
  createProvider: (model: string) => Provider;
  signal: AbortSignal;
  timeoutMs?: number;
}

export type GenerationErrorCode =
  | "provider_unavailable"
  | "output_too_large"
  | "output_unparseable"
  | "too_many_files"
  | "aborted";

export type GenerationResult =
  | {
      ok: true;
      model: string;
      fellBackFrom?: { model: string; reason: string };
      files: GeneratedFile[];
      rejected: RejectedFile[];
      usage?: GenerationUsage;
    }
  | { ok: false; code: GenerationErrorCode; message: string };
