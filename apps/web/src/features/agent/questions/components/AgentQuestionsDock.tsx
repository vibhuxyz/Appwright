import type { LateQuestions } from "../../transcript";
import { useQuestionDock, type LateAnswerTarget } from "../hooks";
import { DockFooter } from "./DockFooter";
import { DockFrame } from "./DockFrame";
import { DockStepBody } from "./DockStepBody";

interface AgentQuestionsDockProps {
  projectId: string;
  sessionId: string;
  late?: { questions: LateQuestions; target: LateAnswerTarget };
  onCollapse: () => void;
}

export function AgentQuestionsDock({ projectId, sessionId, late, onCollapse }: AgentQuestionsDockProps) {
  const dock = useQuestionDock({ projectId, sessionId, late });
  return (
    <DockFrame
      onMinimize={onCollapse}
      footer={dock.currentStep && (
        <DockFooter
          stepIndex={dock.stepIndex}
          stepCount={dock.steps.length}
          isLastStep={dock.isLastStep}
          canAutoAnswer={dock.canAutoAnswer}
          isSubmitting={dock.isSubmitting || dock.isSubmitBlocked}
          onBack={dock.actions.back}
          onForward={dock.actions.forward}
          onAutoAnswer={dock.actions.autoAnswer}
          onNext={dock.actions.next}
        />
      )}
    >
      <DockStepBody
        step={dock.currentStep}
        state={dock.state}
        isLoading={dock.isLoadingSteps}
        loadError={dock.loadError}
        actions={dock.actions}
      />
      {dock.isSubmitBlocked && <p role="status" className="text-xs text-muted">You can send these answers when the agent finishes.</p>}
      {dock.submitError && <p role="alert" className="text-xs text-danger">{dock.submitError}</p>}
    </DockFrame>
  );
}
