import type { ThemeOptionsRequest } from "@repo/contracts";
import { flattenThemeAnswers, flattenThemeQuestions } from "@/features/theme";
import { withDefaults } from "./intake-round";
import type { IntakeGate } from "./types";

export function themeRequestFor(gate: IntakeGate): ThemeOptionsRequest {
  return {
    prompt: gate.prompt,
    answers: flattenThemeAnswers(withDefaults(gate.asked, gate.answers)),
    questions: flattenThemeQuestions(gate.asked),
    ...(gate.plan ? { plan: { pages: gate.plan.pages, features: gate.plan.features } } : {}),
  };
}
