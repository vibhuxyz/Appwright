import { BROWSE_ONLY_PATTERNS } from "./constants";
import type { ProjectScope } from "./types";

export function detectScope(prompt: string): ProjectScope {
  return { isBrowseOnly: BROWSE_ONLY_PATTERNS.some((pattern) => pattern.test(prompt)) };
}
