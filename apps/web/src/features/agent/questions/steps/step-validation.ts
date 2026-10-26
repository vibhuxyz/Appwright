import {
  EMPTY_CREDENTIAL_DRAFT,
  credentialFieldErrorKey,
  missingFieldErrors,
} from "@/features/environment";
import type { DockState, DockStep } from "../types";
import { defaultChoice, hasChoiceAnswer } from "./choice-draft";
import type { DockAction } from "./dock-reducer";
import { credentialErrorKey } from "./step-ids";

export function prefixCredentialErrors(
  requirementId: string,
  errors: Readonly<Record<string, string>>,
): Record<string, string> {
  return Object.fromEntries(Object.entries(errors).map(([key, message]) => [credentialErrorKey(requirementId, key), message]));
}

export function credentialErrorsFor(
  errors: Readonly<Record<string, string>>,
  requirementId: string,
): Record<string, string> {
  const prefix = credentialErrorKey(requirementId, "");
  return Object.fromEntries(Object.entries(errors)
    .filter(([key]) => key.startsWith(prefix))
    .map(([key, message]) => [key.slice(prefix.length), message]));
}

function stepErrorKeys(step: DockStep): string[] {
  if (step.kind !== "integration-field") return [step.id];
  return (["primary", "production"] as const).map((scope) =>
    credentialErrorKey(step.requirement.id, credentialFieldErrorKey(scope, step.field.key)),
  );
}

export function firstInvalidStepIndex(steps: readonly DockStep[], errors: Readonly<Record<string, string>>): number {
  return steps.findIndex((step) => stepErrorKeys(step).some((key) => key in errors));
}

export function validateStep(step: DockStep, state: DockState): Record<string, string> {
  switch (step.kind) {
    case "question":
      return hasChoiceAnswer(state.choiceDrafts[step.id]) ? {} : { [step.id]: "Pick an option or write your own answer" };
    case "integration-choice":
      return state.credentialDrafts[step.requirement.id]?.choice
        ? {}
        : { [step.id]: "Choose the Appwright test key or your own key" };
    case "integration-field": {
      const draft = state.credentialDrafts[step.requirement.id] ?? EMPTY_CREDENTIAL_DRAFT;
      return prefixCredentialErrors(step.requirement.id, {
        ...missingFieldErrors([step.field], draft.primaryValues, "primary"),
        ...(draft.hasSeparateProductionKey ? missingFieldErrors([step.field], draft.productionValues, "production") : {}),
      });
    }
    default: {
      const unhandled: never = step;
      return unhandled;
    }
  }
}

export function autoAnswerAction(step: DockStep, state: DockState): DockAction | null {
  if (step.kind === "question") {
    return { type: "set-choice", stepId: step.id, draft: defaultChoice(step.question.defaultOptionIndex) };
  }
  if (step.kind === "integration-choice" && step.isTestKeyAvailable && !step.isTestKeyExhausted) {
    const draft = state.credentialDrafts[step.requirement.id] ?? EMPTY_CREDENTIAL_DRAFT;
    return {
      type: "set-credential",
      requirementId: step.requirement.id,
      draft: { ...draft, choice: "APPWRIGHT_TEST_KEY" },
      clearedErrorPrefix: step.id,
    };
  }
  return null;
}
