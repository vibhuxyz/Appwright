import { DockFooter, DockFrame } from "../components";
import { hasQuestionsAfter } from "./intake-steps";
import { IntakeStepBody } from "./IntakeStepBody";
import type { IntakeDockControls } from "./types";
import { useIntakeDock } from "./use-intake-dock";

interface IntakeQuestionsDockProps {
  controls: IntakeDockControls;
  onCollapse: () => void;
}

export function IntakeQuestionsDock({ controls, onCollapse }: IntakeQuestionsDockProps) {
  const dock = useIntakeDock(controls);
  return (
    <DockFrame
      isTall={dock.currentStep?.kind === "theme"}
      onMinimize={onCollapse}
      footer={dock.currentStep && (
        <DockFooter
          stepIndex={dock.stepIndex}
          stepCount={dock.steps.length}
          isLastStep={dock.isLastStep}
          canAutoAnswer={dock.canAutoAnswer}
          isSubmitting={controls.isSubmitting}
          onBack={dock.actions.back}
          onForward={dock.actions.forward}
          onAutoAnswer={dock.actions.autoAnswer}
          {...(hasQuestionsAfter(dock.steps, dock.stepIndex) ? { onAutoAnswerRest: dock.actions.autoAnswerRest } : {})}
          onNext={dock.actions.next}
        />
      )}
    >
      <IntakeStepBody dock={dock} isSubmitting={controls.isSubmitting} />
      {controls.gate.error && <p role="alert" className="text-xs text-danger">{controls.gate.error}</p>}
    </DockFrame>
  );
}
