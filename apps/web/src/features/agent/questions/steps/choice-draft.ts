import type { AgentQuestionAnswer } from "@repo/contracts";
import type { ChoiceDraft } from "../types";

type InputType = "single" | "multiple";

export const EMPTY_CHOICE_DRAFT: ChoiceDraft = { selectedOptionIndexes: [], isOtherSelected: false, otherText: "" };

export function toggleOption(draft: ChoiceDraft, optionIndex: number, inputType: InputType): ChoiceDraft {
  if (inputType === "single") return { ...draft, selectedOptionIndexes: [optionIndex], isOtherSelected: false };
  const isSelected = draft.selectedOptionIndexes.includes(optionIndex);
  const selectedOptionIndexes = isSelected
    ? draft.selectedOptionIndexes.filter((index) => index !== optionIndex)
    : [...draft.selectedOptionIndexes, optionIndex].sort((left, right) => left - right);
  return { ...draft, selectedOptionIndexes };
}

export function toggleOther(draft: ChoiceDraft, inputType: InputType): ChoiceDraft {
  const isOtherSelected = !draft.isOtherSelected;
  if (inputType === "single" && isOtherSelected) return { ...draft, isOtherSelected, selectedOptionIndexes: [] };
  return { ...draft, isOtherSelected };
}

export function defaultChoice(defaultOptionIndex: number): ChoiceDraft {
  return { ...EMPTY_CHOICE_DRAFT, selectedOptionIndexes: [defaultOptionIndex] };
}

export function hasChoiceAnswer(draft: ChoiceDraft | undefined): boolean {
  if (!draft) return false;
  return draft.selectedOptionIndexes.length > 0 || (draft.isOtherSelected && draft.otherText.trim().length > 0);
}

export function toAnswer(draft: ChoiceDraft | undefined): AgentQuestionAnswer {
  const otherText = draft?.isOtherSelected ? draft.otherText.trim() : "";
  return {
    selectedOptionIndexes: [...(draft?.selectedOptionIndexes ?? [])],
    ...(otherText ? { otherText } : {}),
  };
}
