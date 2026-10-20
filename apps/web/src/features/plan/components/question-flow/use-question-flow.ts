import { useRef, useState } from "react";
import { SKIP_ANSWER, type AnswerValue, type PlanAnswers, type PlanQuestion } from "../../schemas/plan-schemas";
import type { AnsweredQuestion } from "./types";

interface UseQuestionFlowOptions {
  questions: readonly PlanQuestion[];
  onComplete: (answers: PlanAnswers) => void;
}

interface UseQuestionFlowResult {
  currentQuestion: PlanQuestion | undefined;
  answered: readonly AnsweredQuestion[];
  isComplete: boolean;
  answerCurrent: (value: string) => void;
  skipCurrent: () => void;
  skipRemaining: () => void;
}

function toPlanAnswers(answered: readonly AnsweredQuestion[]): PlanAnswers {
  const answers: Record<string, AnswerValue> = {};
  for (const entry of answered) {
    answers[entry.question.need] = entry.value;
  }
  return answers;
}

export function useQuestionFlow({ questions, onComplete }: UseQuestionFlowOptions): UseQuestionFlowResult {
  const [answered, setAnswered] = useState<readonly AnsweredQuestion[]>([]);
  const hasCompletedRef = useRef(false);
  const currentQuestion = questions[answered.length];
  const isComplete = answered.length >= questions.length && questions.length > 0;

  function commit(next: readonly AnsweredQuestion[]) {
    setAnswered(next);
    if (next.length < questions.length || hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    onComplete(toPlanAnswers(next));
  }

  function recordAnswer(value: AnswerValue) {
    const question = questions[answered.length];
    if (!question || hasCompletedRef.current) return;
    commit([...answered, { question, value }]);
  }

  function skipRemaining() {
    if (hasCompletedRef.current || answered.length >= questions.length) return;
    const rest = questions.slice(answered.length).map((question) => ({
      question,
      value: SKIP_ANSWER,
    }));
    commit([...answered, ...rest]);
  }

  return {
    currentQuestion,
    answered,
    isComplete,
    answerCurrent: (value) => recordAnswer(value),
    skipCurrent: () => recordAnswer(SKIP_ANSWER),
    skipRemaining,
  };
}
