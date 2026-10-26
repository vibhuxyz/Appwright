import type { Dispatch } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import type { AgentQuestionResponse } from "@repo/contracts";
import type { CredentialDraft } from "@/features/environment";
import { toast } from "@/shared/components/toast";
import {
  autoAnswerAction,
  firstInvalidStepIndex,
  planDockSubmission,
  validateStep,
  type DockAction,
  type SubmissionPlan,
} from "../steps";
import type { ChoiceDraft, DockState, DockStep } from "../types";
import type { SubmissionResult } from "./use-dock-submission";

export interface DockActionInput {
  steps: readonly DockStep[];
  state: DockState;
  stepIndex: number;
  dispatch: Dispatch<DockAction>;
  questions: readonly AgentQuestionResponse[];
  submit: UseMutationResult<SubmissionResult, Error, Extract<SubmissionPlan, { ok: true }>>;
}

const NOTICE_TITLE = "Before you deploy";

interface DockNavigation {
  lastIndex: number;
  goTo: (index: number) => void;
  showErrors: (errors: Record<string, string>) => void;
}

function createNavigation({ steps, dispatch }: DockActionInput): DockNavigation {
  const lastIndex = Math.max(steps.length - 1, 0);
  const goTo = (index: number) => dispatch({ type: "go-to", stepIndex: Math.min(Math.max(index, 0), lastIndex) });
  const showErrors = (errors: Record<string, string>) => {
    dispatch({ type: "set-errors", errors });
    const invalidIndex = firstInvalidStepIndex(steps, errors);
    if (invalidIndex >= 0) goTo(invalidIndex);
  };
  return { lastIndex, goTo, showErrors };
}

function createSubmitAll(input: DockActionInput, navigation: DockNavigation): () => void {
  return () => {
    const plan = planDockSubmission({ steps: input.steps, state: input.state, questions: input.questions });
    if (!plan.ok) {
      navigation.showErrors(plan.errors);
      return;
    }
    input.submit.mutate(plan, {
      onSuccess: (result) => {
        if (Object.keys(result.errors).length > 0) navigation.showErrors(result.errors);
        for (const notice of result.notices) toast.warning(NOTICE_TITLE, notice);
      },
    });
  };
}

function createNext(input: DockActionInput, navigation: DockNavigation, submitAll: () => void): () => void {
  return () => {
    const step = input.steps[input.stepIndex];
    if (!step) return;
    const errors = validateStep(step, input.state);
    if (Object.keys(errors).length > 0) {
      input.dispatch({ type: "set-errors", errors: { ...input.state.errors, ...errors } });
      return;
    }
    if (input.stepIndex < navigation.lastIndex) navigation.goTo(input.stepIndex + 1);
    else submitAll();
  };
}

function createAutoAnswer(input: DockActionInput, navigation: DockNavigation): () => void {
  return () => {
    const step = input.steps[input.stepIndex];
    const action = step ? autoAnswerAction(step, input.state) : null;
    if (!action) return;
    input.dispatch(action);
    if (input.stepIndex < navigation.lastIndex) navigation.goTo(input.stepIndex + 1);
  };
}

export function createDockActions(input: DockActionInput) {
  const navigation = createNavigation(input);
  const submitAll = createSubmitAll(input, navigation);
  return {
    next: createNext(input, navigation, submitAll),
    back: () => navigation.goTo(input.stepIndex - 1),
    forward: () => navigation.goTo(input.stepIndex + 1),
    autoAnswer: createAutoAnswer(input, navigation),
    setChoice: (stepId: string, draft: ChoiceDraft) => input.dispatch({ type: "set-choice", stepId, draft }),
    setCredential: (requirementId: string, draft: CredentialDraft, clearedErrorPrefix: string) =>
      input.dispatch({ type: "set-credential", requirementId, draft, clearedErrorPrefix }),
  };
}

export type DockActions = ReturnType<typeof createDockActions>;
