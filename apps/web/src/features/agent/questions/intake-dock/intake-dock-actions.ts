import type { Dispatch } from "react";
import type { ThemeOption } from "@repo/contracts";
import type { ThemeOverrides } from "../step-views";
import type { ChoiceDraft } from "../types";
import { intakeAnswers, intakeAutoAnswer, validateIntakeStep } from "./intake-steps";
import type { IntakeDockAction, IntakeDockControls, IntakeDockState, IntakeStep } from "./types";

export interface IntakeDockActionInput {
  controls: IntakeDockControls;
  steps: readonly IntakeStep[];
  state: IntakeDockState;
  stepIndex: number;
  themes: readonly ThemeOption[];
  selectedTheme: ThemeOption | undefined;
  dispatch: Dispatch<IntakeDockAction>;
}

function submitStage(input: IntakeDockActionInput): void {
  const { controls, steps, state, dispatch } = input;
  if (controls.gate.status === "choosing-theme") {
    if (input.selectedTheme) controls.chooseTheme(input.selectedTheme);
    return;
  }
  if (controls.gate.status === "reviewing-plan") {
    const draft = state.choiceDrafts[steps[0]?.id ?? ""];
    const feedback = draft?.isOtherSelected ? draft.otherText.trim() : "";
    if (feedback) controls.revisePlan(feedback);
    else controls.approvePlan();
    return;
  }
  const errors: Record<string, string> = Object.assign({}, ...steps.map((step) => validateIntakeStep(step, state, input.themes.length > 0)));
  const invalidIndex = steps.findIndex((step) => step.id in errors);
  if (invalidIndex >= 0) {
    dispatch({ type: "set-errors", errors });
    dispatch({ type: "go-to", stepIndex: invalidIndex });
    return;
  }
  controls.submit(intakeAnswers(steps, state));
}

function createNext(input: IntakeDockActionInput, lastIndex: number): () => void {
  return () => {
    const step = input.steps[input.stepIndex];
    if (!step) return;
    const errors = validateIntakeStep(step, input.state, input.themes.length > 0);
    if (Object.keys(errors).length > 0) {
      input.dispatch({ type: "set-errors", errors: { ...input.state.errors, ...errors } });
      return;
    }
    if (input.stepIndex < lastIndex) input.dispatch({ type: "go-to", stepIndex: input.stepIndex + 1 });
    else submitStage(input);
  };
}

export function createIntakeDockActions(input: IntakeDockActionInput) {
  const lastIndex = Math.max(input.steps.length - 1, 0);
  const goTo = (index: number) => input.dispatch({ type: "go-to", stepIndex: Math.min(Math.max(index, 0), lastIndex) });
  const advance = () => {
    if (input.stepIndex < lastIndex) goTo(input.stepIndex + 1);
  };
  return {
    next: createNext(input, lastIndex),
    back: () => goTo(input.stepIndex - 1),
    forward: () => goTo(input.stepIndex + 1),
    autoAnswer: () => {
      const step = input.steps[input.stepIndex];
      const action = step ? intakeAutoAnswer(step, input.themes[0]?.id) : null;
      if (!action) return;
      input.dispatch(action);
      advance();
    },
    setChoice: (stepId: string, draft: ChoiceDraft) => input.dispatch({ type: "set-choice", stepId, draft }),
    setAnswer: (stepId: string, value: string) => input.dispatch({ type: "set-answer", stepId, value }),
    continueWith: (stepId: string, value: string) => {
      input.dispatch({ type: "set-answer", stepId, value });
      advance();
    },
    selectTheme: (themeId: string) => input.dispatch({ type: "select-theme", themeId }),
    applyThemeOverrides: (overrides: ThemeOverrides) => input.dispatch({ type: "set-theme-overrides", overrides }),
  };
}

export type IntakeDockActions = ReturnType<typeof createIntakeDockActions>;
