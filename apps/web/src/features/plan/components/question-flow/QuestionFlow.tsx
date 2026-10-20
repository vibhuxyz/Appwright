import { MessageCircleQuestion } from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { Panel, PanelHeader } from "@/shared/components/ui/Panel";
import type { PlanAnswers, PlanQuestion } from "../../schemas/plan-schemas";
import { AnswerControls } from "./AnswerControls";
import { QuestionScrollback } from "./QuestionScrollback";
import { RequirementsPreviewPanel } from "./RequirementsPreviewPanel";
import { useQuestionFlow } from "./use-question-flow";

interface QuestionFlowProps {
  questions: readonly PlanQuestion[];
  profileTitle: string;
  isSubmitting: boolean;
  error?: string | null;
  onSubmit: (answers: PlanAnswers) => void;
  onRetry?: () => void;
}

export function QuestionFlow({
  questions,
  profileTitle,
  isSubmitting,
  error,
  onSubmit,
  onRetry,
}: QuestionFlowProps) {
  const { currentQuestion, answered, isComplete, answerCurrent, skipCurrent, skipRemaining } = useQuestionFlow({
    questions,
    onComplete: onSubmit,
  });

  return (
    <div className="flex flex-col gap-3">
      <RequirementsPreviewPanel title={profileTitle} questions={questions} answered={answered} />
      <Panel>
        <PanelHeader
          icon={<MessageCircleQuestion className="size-4 text-muted" aria-hidden />}
          title="A few quick questions"
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
          {questions.length === 0 ? (
            <p className="text-sm text-muted">No follow-up questions needed — continuing…</p>
          ) : (
            <>
              <p className="mb-3 text-sm text-muted">
                Answer or skip. A skip keeps that question’s default, and the plan uses it.
              </p>
              <QuestionScrollback
                answered={answered}
                currentQuestion={isComplete ? undefined : currentQuestion}
              />
            </>
          )}
        </div>
        {error && (
          <div className="flex items-center gap-3 px-4 pb-2">
            <p className="text-sm text-danger">{error}</p>
            {onRetry && (
              <Button type="button" variant="outline" onClick={onRetry}>
                Try again
              </Button>
            )}
          </div>
        )}
        {!isComplete && currentQuestion && (
          <AnswerControls
            key={currentQuestion.need}
            options={currentQuestion.options}
            suggestion={currentQuestion.options[currentQuestion.defaultOptionIndex] ?? ""}
            isSubmitting={isSubmitting}
            onAnswer={answerCurrent}
            onSkip={skipCurrent}
            onSkipRest={skipRemaining}
          />
        )}
        {isComplete && questions.length > 0 && !error && (
          <p className="border-t border-border-soft px-4 py-3 text-sm text-muted">
            {isSubmitting ? "Sending…" : "Saved in the chat. Continuing…"}
          </p>
        )}
      </Panel>
    </div>
  );
}
