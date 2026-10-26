import { MAX_KNOWN_FACTS, MAX_QUESTION_TEXT_CHARS, MIN_KNOWN_FACT_CHARS } from "./constants";
import type { IntakeQuestion } from "./types";

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function isGroundedFact(value: string, request: string): boolean {
  const fact = normalize(value);
  return fact.length >= MIN_KNOWN_FACT_CHARS && fact.length <= MAX_QUESTION_TEXT_CHARS && request.includes(fact);
}

export function groundedKnownNeeds(known: Readonly<Record<string, string>>, prompt: string): ReadonlySet<string> {
  const request = normalize(prompt);
  const grounded = Object.entries(known)
    .slice(0, MAX_KNOWN_FACTS)
    .filter(([, value]) => isGroundedFact(value, request))
    .map(([need]) => need);
  return new Set(grounded);
}

export function withoutKnownFacts(
  catalog: readonly IntakeQuestion[],
  knownNeeds: ReadonlySet<string>,
): IntakeQuestion[] {
  return catalog.filter((question) => !(question.inputType === "short-text" && knownNeeds.has(question.need)));
}
