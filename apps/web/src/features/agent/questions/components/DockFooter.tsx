import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/shared/components/ui/Button";

interface DockFooterProps {
  stepIndex: number;
  stepCount: number;
  isLastStep: boolean;
  canAutoAnswer: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onForward: () => void;
  onAutoAnswer: () => void;
  onNext: () => void;
}

const NAV_BUTTON_CLASS =
  "grid size-7 cursor-pointer place-items-center rounded-lg text-muted transition-colors hover:bg-surface-3 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40";

export function DockFooter({
  stepIndex,
  stepCount,
  isLastStep,
  canAutoAnswer,
  isSubmitting,
  onBack,
  onForward,
  onAutoAnswer,
  onNext,
}: DockFooterProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border-soft px-3 py-2.5">
      <div className="flex items-center gap-1 text-sm text-muted">
        <button type="button" onClick={onBack} disabled={stepIndex === 0} aria-label="Previous question" className={NAV_BUTTON_CLASS}>
          <ChevronLeft aria-hidden="true" className="size-4" />
        </button>
        <span aria-live="polite">Question {stepIndex + 1} of {stepCount}</span>
        <button type="button" onClick={onForward} disabled={isLastStep} aria-label="Next question" className={NAV_BUTTON_CLASS}>
          <ChevronRight aria-hidden="true" className="size-4" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="md" onClick={onAutoAnswer} disabled={!canAutoAnswer || isSubmitting}>
          Auto-answer
        </Button>
        <Button variant="primary" size="md" onClick={onNext} disabled={isSubmitting} className="min-w-20">
          {isSubmitting ? "Submitting…" : isLastStep ? "Submit" : "Next"}
        </Button>
      </div>
    </div>
  );
}
