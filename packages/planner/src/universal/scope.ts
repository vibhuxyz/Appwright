import { BROWSE_ONLY_PATTERNS, NO_BACKEND_PATTERNS, SINGLE_PAGE_PATTERNS } from "./constants";
import type { ProjectScope } from "./types";

function matchesAny(patterns: readonly RegExp[], text: string): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

export function detectScope(text: string): ProjectScope {
  return {
    isBrowseOnly: matchesAny(BROWSE_ONLY_PATTERNS, text),
    isSinglePage: matchesAny(SINGLE_PAGE_PATTERNS, text),
    isStatic: matchesAny(NO_BACKEND_PATTERNS, text),
  };
}
