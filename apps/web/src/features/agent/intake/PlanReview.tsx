import { useState, type FormEvent } from "react";
import { ClipboardList, ImageIcon } from "lucide-react";
import { PLAN_PREVIEW_LIMITS, type PlanPreview } from "@repo/contracts";
import { Button } from "@/shared/components/ui/Button";
import { Panel, PanelHeader } from "@/shared/components/ui/Panel";
import { PlanPageList } from "./PlanPageList";

function imageCount(plan: PlanPreview): number {
  return plan.pages.reduce((count, page) => count + page.sections.filter((section) => section.image).length, 0);
}

export function PlanReview({
  plan,
  onApprove,
  onRevise,
}: {
  plan: PlanPreview;
  onApprove: () => void;
  onRevise: (feedback: string) => void;
}) {
  const [isRevising, setIsRevising] = useState(false);
  const [feedback, setFeedback] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (feedback.trim().length > 0) onRevise(feedback.trim());
  };

  return (
    <Panel>
      <PanelHeader icon={<ClipboardList className="size-4 text-muted" aria-hidden />} title="Review the plan" />
      <div className="flex flex-col gap-3 p-4">
        <p className="text-sm text-muted">
          {plan.pages.length} pages planned from your answers. Sections marked
          <ImageIcon className="mx-1 inline size-3" aria-label="image" />
          need an image ({imageCount(plan)} in total). The design system is made for this plan next.
        </p>
        <PlanPageList pages={plan.pages} />
        {(plan.features.length > 0 || plan.entities.length > 0) && (
          <p className="text-xs text-muted">
            {[...plan.features.map((feature) => `Feature: ${feature}`), ...plan.entities.map((entity) => `Data: ${entity}`)].join(" · ")}
          </p>
        )}
        {isRevising ? (
          <form className="flex flex-col gap-2" onSubmit={submit}>
            <label htmlFor="plan-feedback" className="text-xs text-foreground-secondary">
              What should change?
            </label>
            <textarea
              id="plan-feedback"
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              placeholder="Add a cakes page, drop reviews, put a carousel on the home page"
              rows={3}
              maxLength={PLAN_PREVIEW_LIMITS.maxFeedbackChars}
              className="min-w-0 resize-none rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsRevising(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={feedback.trim().length === 0}>
                Re-plan
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsRevising(true)}>
              Request changes
            </Button>
            <Button type="button" onClick={onApprove}>
              Looks good, design it
            </Button>
          </div>
        )}
      </div>
    </Panel>
  );
}
