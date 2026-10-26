import { useMemo, useReducer } from "react";
import { useIntegrationCatalog } from "@/features/environment";
import type { LateQuestions } from "../../transcript";
import { INITIAL_DOCK_STATE, autoAnswerAction, buildDockSteps, dockReducer, lateSource } from "../steps";
import { createDockActions } from "./dock-actions";
import { useDockSubmission } from "./use-dock-submission";
import { useLateDockSubmission, type LateAnswerTarget } from "./use-late-dock-submission";
import { usePendingDockItems } from "./use-pending-dock-items";

interface UseQuestionDockInput {
  projectId: string;
  sessionId: string;
  late?: { questions: LateQuestions; target: LateAnswerTarget };
}

export function useQuestionDock({ projectId, sessionId, late }: UseQuestionDockInput) {
  const pending = usePendingDockItems(projectId, late ? undefined : sessionId);
  const lateQuestions = late?.questions;
  const lateItems = useMemo(
    () => (lateQuestions ? lateSource(lateQuestions, { projectId, sessionId }) : null),
    [lateQuestions, projectId, sessionId],
  );
  const { questions, requirements } = lateItems ?? pending;
  const catalogQuery = useIntegrationCatalog(requirements.length > 0 ? projectId : undefined);
  const [state, dispatch] = useReducer(dockReducer, INITIAL_DOCK_STATE);
  const liveSubmit = useDockSubmission(projectId, sessionId);
  const lateSubmit = useLateDockSubmission(projectId, late);
  const submit = late ? lateSubmit : liveSubmit;
  const steps = useMemo(
    () => buildDockSteps({ questions, requirements, catalog: catalogQuery.data, credentialDrafts: state.credentialDrafts }),
    [questions, requirements, catalogQuery.data, state.credentialDrafts],
  );
  const stepIndex = Math.min(state.stepIndex, Math.max(steps.length - 1, 0));
  const currentStep = steps[stepIndex];
  const actions = createDockActions({ steps, state, stepIndex, dispatch, questions, submit });

  return {
    steps,
    stepIndex,
    currentStep,
    isLastStep: stepIndex >= steps.length - 1,
    state,
    canAutoAnswer: currentStep ? autoAnswerAction(currentStep, state) !== null : false,
    isLoadingSteps: steps.length === 0 && catalogQuery.isLoading,
    loadError: catalogQuery.error?.message ?? null,
    isSubmitting: submit.isPending,
    isSubmitBlocked: Boolean(late?.target.isBlocked),
    submitError: submit.error?.message ?? null,
    actions,
  };
}

export type QuestionDock = ReturnType<typeof useQuestionDock>;
