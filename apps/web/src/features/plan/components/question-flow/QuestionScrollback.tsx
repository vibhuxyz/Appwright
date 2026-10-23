import { SKIP_ANSWER, type PlanQuestion } from "../../schemas/plan-schemas";
import { formatAnswerLabel } from "./format-answer-label";
import { QuestionBubble } from "./QuestionBubble";
import type { AnsweredQuestion } from "./types";

interface QuestionScrollbackProps {
  answered: readonly AnsweredQuestion[];
  currentQuestion: PlanQuestion | undefined;
}

export function QuestionScrollback({ answered, currentQuestion }: QuestionScrollbackProps) {
  return (
    <ul className="flex flex-col gap-3">
      {answered.map((entry) => (
        <li key={entry.question.need} className="flex flex-col gap-2">
          <QuestionBubble role="assistant">{entry.question.text}</QuestionBubble>
          <QuestionBubble role="user">
            {formatAnswerLabel(
              entry.value,
              entry.question.options[entry.question.defaultOptionIndex] ?? "",
            )}
          </QuestionBubble>
          <p className="pl-8 text-xs text-muted">
            {entry.value === SKIP_ANSWER ? "Using the suggested default." : "Added to the plan."}
          </p>
        </li>
      ))}
      {currentQuestion && (
        <li className="flex flex-col gap-1">
          <QuestionBubble role="assistant">{currentQuestion.text}</QuestionBubble>
          {currentQuestion.why && (
            <p className="pl-8 text-xs text-muted">{currentQuestion.why}</p>
          )}
        </li>
      )}
    </ul>
  );
}
