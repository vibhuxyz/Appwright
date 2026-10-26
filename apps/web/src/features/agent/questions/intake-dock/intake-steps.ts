import { SKIP_ANSWER, contactsAreFilled, encodeContactAnswer, type PlanAnswers, type PlanQuestion } from "@/features/plan";
import type { IntakeGate } from "../../intake";
import { defaultChoice, hasChoiceAnswer } from "../steps";
import type { IntakeDockAction, IntakeDockState, IntakeStep } from "./types";

const MAX_ANSWER_CHARS = 1000;
export const PLAN_STEP_ID = "plan-review";
export const THEME_STEP_ID = "theme";

const MISSING_ANSWER: Record<PlanQuestion["inputType"], string> = {
  single: "Pick an option or write your own answer",
  multiple: "Pick at least one option or write your own answer",
  "short-text": "Write an answer, or use Auto-answer",
  date: "Choose a date, or use Auto-answer",
  images: "Add your images and press Continue, or use Auto-answer",
  contacts: "Add your phone, email and address",
};

export function isChoiceQuestion(question: PlanQuestion): boolean {
  return question.inputType === "single" || question.inputType === "multiple";
}

export function buildIntakeSteps(gate: IntakeGate): IntakeStep[] {
  if (gate.status === "asking") {
    return gate.questions.map((question): IntakeStep => ({ kind: "question", id: `intake:${question.need}`, question }));
  }
  if (gate.status === "reviewing-plan" && gate.plan) return [{ kind: "plan-review", id: PLAN_STEP_ID, plan: gate.plan }];
  if (gate.status === "choosing-theme") return [{ kind: "theme", id: THEME_STEP_ID }];
  return [];
}

export function questionAnswer(step: Extract<IntakeStep, { kind: "question" }>, state: IntakeDockState): string | null {
  const { question } = step;
  if (question.inputType === "contacts") {
    const value = state.answers[step.id] ?? encodeContactAnswer(question.prefill ?? {});
    return contactsAreFilled(value, question.options) ? value.slice(0, MAX_ANSWER_CHARS) : null;
  }
  if (!isChoiceQuestion(question)) {
    const value = state.answers[step.id]?.trim() ?? "";
    return value.length > 0 ? value.slice(0, MAX_ANSWER_CHARS) : null;
  }
  const draft = state.choiceDrafts[step.id];
  if (!draft || !hasChoiceAnswer(draft)) return null;
  const chosen = draft.selectedOptionIndexes.flatMap((index) => question.options[index] ?? []);
  const own = draft.isOtherSelected ? draft.otherText.trim() : "";
  return [...chosen, ...(own ? [own] : [])].join(", ").slice(0, MAX_ANSWER_CHARS);
}

export function validateIntakeStep(step: IntakeStep, state: IntakeDockState, hasThemes: boolean): Record<string, string> {
  if (step.kind === "plan-review") return {};
  if (step.kind === "theme") return hasThemes ? {} : { [step.id]: "Wait for the design systems to load" };
  if (step.question.importance === "optional" || questionAnswer(step, state) !== null) return {};
  return { [step.id]: MISSING_ANSWER[step.question.inputType] };
}

export function intakeAnswers(steps: readonly IntakeStep[], state: IntakeDockState): PlanAnswers {
  const answers: Record<string, string> = {};
  for (const step of steps) {
    if (step.kind === "question") answers[step.question.need] = questionAnswer(step, state) ?? SKIP_ANSWER;
  }
  return answers;
}

function questionAutoAnswer(step: Extract<IntakeStep, { kind: "question" }>): IntakeDockAction | null {
  const { question } = step;
  const suggestion = question.options[question.defaultOptionIndex];
  if (isChoiceQuestion(question)) return { type: "set-choice", stepId: step.id, draft: defaultChoice(question.defaultOptionIndex) };
  if (question.inputType === "images") {
    const value = question.options.map((section) => `${section}: generate`).join("; ").slice(0, MAX_ANSWER_CHARS);
    return value ? { type: "set-answer", stepId: step.id, value } : null;
  }
  if (question.inputType === "contacts" || !suggestion) return null;
  return { type: "set-answer", stepId: step.id, value: suggestion };
}

export function intakeAutoAnswer(step: IntakeStep, firstThemeId: string | undefined): IntakeDockAction | null {
  if (step.kind === "plan-review") return { type: "set-choice", stepId: step.id, draft: defaultChoice(0) };
  if (step.kind === "theme") return firstThemeId ? { type: "select-theme", themeId: firstThemeId } : null;
  return questionAutoAnswer(step);
}
