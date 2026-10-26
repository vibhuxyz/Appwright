import { useState } from "react";
import type { AssetRequestResponse } from "@repo/contracts";
import { useResolveSlot } from "@/features/assets";
import { buildImageSteps, firstOpenStepIndex, isSlotDone } from "./image-steps";

const SLOT_NOT_CHOSEN = "Choose an image for this section, or use Auto-answer to let me pick one.";

export function useImageDock(input: { sessionId: string; projectId: string; requests: readonly AssetRequestResponse[] }) {
  const resolver = useResolveSlot(input.sessionId, input.projectId);
  const steps = buildImageSteps(input.requests);
  const [chosenIndex, setChosenIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastIndex = Math.max(steps.length - 1, 0);
  const stepIndex = Math.min(chosenIndex ?? firstOpenStepIndex(steps), lastIndex);
  const currentStep = steps[stepIndex];
  const goTo = (index: number) => {
    setError(null);
    setChosenIndex(Math.min(Math.max(index, 0), lastIndex));
  };
  const next = () => {
    if (!currentStep) return;
    if (!isSlotDone(currentStep.slot)) {
      setError(SLOT_NOT_CHOSEN);
      return;
    }
    goTo(stepIndex < lastIndex ? stepIndex + 1 : firstOpenStepIndex(steps));
  };
  const autoAnswer = () => {
    if (!currentStep || isSlotDone(currentStep.slot)) return;
    resolver.skip.mutate({ assetRequestId: currentStep.assetRequestId, slotId: currentStep.slot.id });
    if (stepIndex < lastIndex) goTo(stepIndex + 1);
  };
  return {
    steps,
    stepIndex,
    currentStep,
    error,
    resolver,
    isLastStep: stepIndex >= lastIndex,
    canAutoAnswer: Boolean(currentStep && !isSlotDone(currentStep.slot)),
    actions: { next, autoAnswer, back: () => goTo(stepIndex - 1), forward: () => goTo(stepIndex + 1) },
  };
}
