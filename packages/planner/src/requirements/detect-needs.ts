import {
  DEFAULT_CONFIDENCE,
  DEFAULT_REQUIRED,
  EXPLICIT_CONFIDENCE,
  EXPLICIT_PATTERNS,
  INFERRED_CONFIDENCE,
  INFERRED_PATTERNS,
  MAX_EVIDENCE_PER_NEED,
  MAX_PROMPT_CHARS,
} from "./constants";
import { NEED_NAMES, type DetectedNeed, type NeedName, type Needs } from "./types";

function matches(patterns: readonly RegExp[], text: string): string[] {
  return patterns.flatMap((pattern) => {
    const found = text.match(pattern)?.[0];
    return found ? [found.toLowerCase()] : [];
  });
}

function detectNeed(name: NeedName, text: string): DetectedNeed {
  const explicit = matches(EXPLICIT_PATTERNS[name], text);
  if (explicit.length > 0) {
    return {
      required: true,
      confidence: EXPLICIT_CONFIDENCE,
      source: "explicit",
      evidence: explicit.slice(0, MAX_EVIDENCE_PER_NEED),
    };
  }
  const inferred = matches(INFERRED_PATTERNS[name], text);
  if (inferred.length > 0) {
    return {
      required: true,
      confidence: INFERRED_CONFIDENCE,
      source: "inferred",
      evidence: inferred.slice(0, MAX_EVIDENCE_PER_NEED),
    };
  }
  return {
    required: DEFAULT_REQUIRED[name],
    confidence: DEFAULT_CONFIDENCE,
    source: "default",
    evidence: [],
  };
}

export function detectNeeds(prompt: string): Needs {
  const text = prompt.slice(0, MAX_PROMPT_CHARS);
  const entries = NEED_NAMES.map((name) => [name, detectNeed(name, text)]);
  return Object.freeze(Object.fromEntries(entries)) as Needs;
}
