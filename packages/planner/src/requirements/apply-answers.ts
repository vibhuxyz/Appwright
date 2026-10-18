import { EXPLICIT_CONFIDENCE } from "./constants";
import { NEED_NAMES, type NeedName, type Needs } from "./types";

export function applyAnswers(
  needs: Needs,
  answers: Readonly<Partial<Record<NeedName, boolean>>>,
): Needs {
  const entries = NEED_NAMES.map((name) => {
    const answer = answers[name];
    const current = needs[name];
    if (answer === undefined) return [name, current];
    return [
      name,
      {
        required: answer,
        confidence: EXPLICIT_CONFIDENCE,
        source: "explicit",
        evidence: ["user answer"],
      },
    ];
  });
  return Object.freeze(Object.fromEntries(entries)) as Needs;
}
