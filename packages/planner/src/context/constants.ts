import type { ContextSectionKind } from "./types";

export const KEEP_ORDER = [
  "stack",
  "entities",
  "owned-file",
  "dependency-output",
  "read-file",
] as const satisfies readonly ContextSectionKind[];

export const SECTION_TAG = "task-context";
export const SECTION_SEPARATOR = "\n\n";
export const DEFAULT_MAX_CONTEXT_BYTES = 48_000;
