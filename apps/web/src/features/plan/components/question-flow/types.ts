import type { AnswerValue, PlanQuestion } from "../../schemas/plan-schemas";

export interface AnsweredQuestion {
  question: PlanQuestion;
  value: AnswerValue;
}
