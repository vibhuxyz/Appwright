export const PLAN_APPROVED_ANSWER = "Looks good — build it";
export const PLAN_CHANGE_LABEL = "Change something";

interface PlanDecisionBubbleProps {
  feedback: readonly string[];
  isApproved: boolean;
}

export function PlanDecisionBubble({ feedback, isApproved }: PlanDecisionBubbleProps) {
  return (
    <div className="max-w-[88%] self-end rounded-2xl rounded-tr-xs border border-info/20 bg-info/10 px-4 py-3 text-[13px] leading-relaxed sm:max-w-[80%]">
      <dl className="space-y-2.5">
        {feedback.map((note, index) => (
          <div key={`${index}-${note}`}>
            <dt className="text-foreground-secondary">Plan — {PLAN_CHANGE_LABEL}</dt>
            <dd className="font-semibold text-foreground">{note}</dd>
          </div>
        ))}
        {isApproved && (
          <div>
            <dt className="text-foreground-secondary">Plan — Does this look right?</dt>
            <dd className="font-semibold text-foreground">{PLAN_APPROVED_ANSWER}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
