export type ContextSectionKind =
  | "stack"
  | "entities"
  | "owned-file"
  | "dependency-output"
  | "read-file";

export interface ContextSection {
  kind: ContextSectionKind;
  source: string;
  body: string;
}

export interface DroppedSection {
  source: string;
  kind: ContextSectionKind;
  reason: string;
}

export interface AssembledContext {
  text: string;
  includedSources: string[];
  dropped: DroppedSection[];
  isTruncated: boolean;
  bytes: number;
}

export interface AssembleOptions {
  maxBytes: number;
}
