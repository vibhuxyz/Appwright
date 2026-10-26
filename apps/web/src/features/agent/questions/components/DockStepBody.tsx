import type { DockActions } from "../hooks";
import type { DockState, DockStep } from "../types";
import { ChoiceQuestionStep, IntegrationStep } from "../step-views";

interface DockStepBodyProps {
  step: DockStep | undefined;
  state: DockState;
  isLoading: boolean;
  loadError: string | null;
  actions: Pick<DockActions, "setChoice" | "setCredential">;
}

export function DockStepBody({ step, state, isLoading, loadError, actions }: DockStepBodyProps) {
  if (loadError) return <p role="alert" className="text-sm text-danger">Could not load the integration options: {loadError}</p>;
  if (!step) {
    return <p role="status" className="text-sm text-muted">{isLoading ? "Loading questions…" : "Preparing questions…"}</p>;
  }
  if (step.kind === "question") {
    return (
      <ChoiceQuestionStep
        stepId={step.id}
        label={step.question.label}
        text={step.question.text}
        options={step.question.options}
        isMultiple={step.question.inputType === "multiple"}
        draft={state.choiceDrafts[step.id]}
        error={state.errors[step.id]}
        onChange={(draft) => actions.setChoice(step.id, draft)}
      />
    );
  }
  return (
    <IntegrationStep
      step={step}
      draft={state.credentialDrafts[step.requirement.id]}
      errors={state.errors}
      onChange={(draft, clearedErrorPrefix) => actions.setCredential(step.requirement.id, draft, clearedErrorPrefix)}
    />
  );
}
