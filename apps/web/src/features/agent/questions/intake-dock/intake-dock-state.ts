import type { IntakeDockAction, IntakeDockState } from "./types";

export const INITIAL_INTAKE_DOCK_STATE: IntakeDockState = {
  stepIndex: 0,
  choiceDrafts: {},
  answers: {},
  themeId: null,
  themeOverrides: {},
  errors: {},
};

function withoutError(errors: Readonly<Record<string, string>>, stepId: string): Record<string, string> {
  return Object.fromEntries(Object.entries(errors).filter(([key]) => key !== stepId));
}

export function intakeDockReducer(state: IntakeDockState, action: IntakeDockAction): IntakeDockState {
  switch (action.type) {
    case "set-choice":
      return { ...state, choiceDrafts: { ...state.choiceDrafts, [action.stepId]: action.draft }, errors: withoutError(state.errors, action.stepId) };
    case "set-answer":
      return { ...state, answers: { ...state.answers, [action.stepId]: action.value }, errors: withoutError(state.errors, action.stepId) };
    case "select-theme":
      return { ...state, themeId: action.themeId };
    case "set-theme-overrides":
      return { ...state, themeId: null, themeOverrides: action.overrides };
    case "go-to":
      return { ...state, stepIndex: Math.max(action.stepIndex, 0) };
    case "set-errors":
      return { ...state, errors: action.errors };
    default: {
      const unhandled: never = action;
      return unhandled;
    }
  }
}
