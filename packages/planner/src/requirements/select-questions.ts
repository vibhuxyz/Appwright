import {
  MAX_QUESTIONS,
  QUESTION_CONFIDENCE_THRESHOLD,
  QUESTION_IMPACT,
  QUESTION_TEXT,
} from "./constants";
import { NEED_NAMES, type Needs, type Question } from "./types";

export function selectQuestions(needs: Needs): Question[] {
  return NEED_NAMES.filter(
    (name) => needs[name].confidence < QUESTION_CONFIDENCE_THRESHOLD,
  )
    .sort(
      (a, b) =>
        QUESTION_IMPACT[b] - QUESTION_IMPACT[a] || a.localeCompare(b),
    )
    .slice(0, MAX_QUESTIONS)
    .map((name) => ({
      need: name,
      text: QUESTION_TEXT[name],
      defaultAnswer: needs[name].required,
    }));
}
