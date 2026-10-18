export type FenceDecision =
  | { allowed: true; path: string }
  | { allowed: false; path: string; reason: string };

export interface WriteFence {
  readonly ownedPrefixes: readonly string[];
  check(path: string): FenceDecision;
}
