import type { PlanPreview, ThemeOption } from "@repo/contracts";
import type { PlanAnswers, PlanQuestion } from "@/features/plan";
import type { IntakeGate } from "../../intake";
import type { ThemeOverrides } from "../step-views";
import type { ChoiceDraft } from "../types";

export type IntakeStep =
  | { kind: "question"; id: string; question: PlanQuestion }
  | { kind: "plan-review"; id: string; plan: PlanPreview }
  | { kind: "theme"; id: string };

export interface IntakeDockState {
  stepIndex: number;
  choiceDrafts: Readonly<Record<string, ChoiceDraft>>;
  answers: Readonly<Record<string, string>>;
  themeId: string | null;
  themeOverrides: ThemeOverrides;
  errors: Readonly<Record<string, string>>;
}

export type IntakeDockAction =
  | { type: "set-choice"; stepId: string; draft: ChoiceDraft }
  | { type: "set-answer"; stepId: string; value: string }
  | { type: "select-theme"; themeId: string }
  | { type: "set-theme-overrides"; overrides: ThemeOverrides }
  | { type: "go-to"; stepIndex: number }
  | { type: "set-errors"; errors: Readonly<Record<string, string>> };

export interface IntakeDockControls {
  gate: IntakeGate;
  isSubmitting: boolean;
  submit: (answers: PlanAnswers) => void;
  approvePlan: () => void;
  revisePlan: (feedback: string) => void;
  chooseTheme: (theme: ThemeOption) => void;
}
