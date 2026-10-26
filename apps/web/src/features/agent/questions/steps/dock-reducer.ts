import type { CredentialDraft } from "@/features/environment";
import type { ChoiceDraft, DockState } from "../types";

export type DockAction =
  | { type: "set-choice"; stepId: string; draft: ChoiceDraft }
  | { type: "set-credential"; requirementId: string; draft: CredentialDraft; clearedErrorPrefix: string }
  | { type: "go-to"; stepIndex: number }
  | { type: "set-errors"; errors: Readonly<Record<string, string>> };

export const INITIAL_DOCK_STATE: DockState = { stepIndex: 0, choiceDrafts: {}, credentialDrafts: {}, errors: {} };

function withoutErrors(errors: Readonly<Record<string, string>>, keyPrefix: string): Record<string, string> {
  return Object.fromEntries(Object.entries(errors).filter(([key]) => !key.startsWith(keyPrefix)));
}

export function dockReducer(state: DockState, action: DockAction): DockState {
  switch (action.type) {
    case "set-choice":
      return {
        ...state,
        choiceDrafts: { ...state.choiceDrafts, [action.stepId]: action.draft },
        errors: withoutErrors(state.errors, action.stepId),
      };
    case "set-credential":
      return {
        ...state,
        credentialDrafts: { ...state.credentialDrafts, [action.requirementId]: action.draft },
        errors: withoutErrors(state.errors, action.clearedErrorPrefix),
      };
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
