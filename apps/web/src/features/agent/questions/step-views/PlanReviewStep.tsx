import { PLAN_PREVIEW_LIMITS, type PlanPreview } from "@repo/contracts";
import type { ChoiceDraft } from "../types";
import { ChoiceQuestionStep } from "./ChoiceQuestionStep";
import { PlanPagesList } from "./PlanPagesList";
import { countLabel, summarizePlan } from "./plan-summary";

export const PLAN_APPROVE_OPTION = "Looks good — build it";

interface PlanReviewStepProps {
  stepId: string;
  plan: PlanPreview;
  draft: ChoiceDraft | undefined;
  error: string | undefined;
  onChange: (draft: ChoiceDraft) => void;
}

function Overview({ plan }: { plan: PlanPreview }) {
  const overview = summarizePlan(plan);
  const photoNote = overview.imageCount > 0 ? `, with ${countLabel(overview.imageCount, "photo")} to place` : "";
  return (
    <div className="space-y-2">
      <div>
        <h3 className="text-[15px] leading-snug font-medium text-foreground">Here is what I will build</h3>
        <p className="mt-1 text-xs text-muted">
          {countLabel(overview.pages.length, "page")}{photoNote}. Tap a page to see a sketch of its layout.
        </p>
      </div>
      <PlanPagesList pages={overview.pages} />
      {plan.features.length > 0 && (
        <p className="text-xs text-muted">
          <span className="text-foreground-secondary">Also included:</span> {plan.features.join(" · ")}
        </p>
      )}
    </div>
  );
}

export function PlanReviewStep({ stepId, plan, draft, error, onChange }: PlanReviewStepProps) {
  return (
    <div className="space-y-5">
      <Overview plan={plan} />
      <div className="border-t border-border-soft pt-4">
        <ChoiceQuestionStep
          stepId={stepId}
          label="Plan"
          text={`Does this ${plan.pages.length}-page plan look right?`}
          options={[PLAN_APPROVE_OPTION]}
          isMultiple={false}
          draft={draft}
          error={error}
          otherLabel="Change something"
          maxOtherChars={PLAN_PREVIEW_LIMITS.maxFeedbackChars}
          onChange={onChange}
        />
      </div>
    </div>
  );
}
