import { ClipboardCheck } from "lucide-react";
import { Panel, PanelHeader } from "@/shared/components/ui/Panel";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import { SKIP_ANSWER, type PlanQuestion } from "../../schemas/plan-schemas";
import { formatAnswerLabel } from "./format-answer-label";
import { formatNeedLabel } from "./format-need-label";
import type { AnsweredQuestion } from "./types";

interface RequirementsPreviewPanelProps {
  title: string;
  questions: readonly PlanQuestion[];
  answered: readonly AnsweredQuestion[];
}

export function RequirementsPreviewPanel({ title, questions, answered }: RequirementsPreviewPanelProps) {
  const answeredByNeed = new Map(answered.map((entry) => [entry.question.need, entry]));

  return (
    <Panel>
      <PanelHeader
        icon={<ClipboardCheck className="size-4 text-muted" aria-hidden />}
        title="Plan preview"
      />
      <div className="flex flex-col gap-4 p-4">
        <div>
          <h3 className="text-xl font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-xs text-muted">Answers land here as you go.</p>
        </div>
        {questions.length === 0 && <p className="text-sm text-muted">Nothing to confirm yet.</p>}
        {questions.length > 0 && (
          <dl className="flex flex-col gap-3 text-sm">
            {questions.map((question) => {
              const entry = answeredByNeed.get(question.need);
              const defaultOption = question.options[question.defaultOptionIndex] ?? "";
              return (
                <div key={question.need} className="border-t border-border-soft pt-3">
                  <dt className="text-xs text-muted">
                    {question.label || formatNeedLabel(question.need)}
                  </dt>
                  <dd className="mt-1 text-foreground">
                    {!entry ? (
                      <Skeleton className="h-3 w-full max-w-40" />
                    ) : (
                      <span className="text-lime">
                        {formatAnswerLabel(entry.value, defaultOption)}
                        {entry.value === SKIP_ANSWER && (
                          <span className="ml-2 text-xs text-muted">Default</span>
                        )}
                      </span>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        )}
      </div>
    </Panel>
  );
}
