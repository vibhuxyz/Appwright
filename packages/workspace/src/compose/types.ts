export interface ComposeInput {
  primaryHex: string;
  capabilityChoices: readonly string[];
}

export interface FileWrite {
  path: string;
  content: string;
}

export interface SkippedInput {
  input: string;
  reason: string;
}

export interface ComposePlan {
  writes: FileWrite[];
  dependencies: string[];
  skipped: SkippedInput[];
}
