import type { SseIntakeProgressFrame } from "@repo/cache";

export type IntakeProgress = Omit<SseIntakeProgressFrame, "kind">;

export const INTAKE_PROGRESS = {
  checkingProject: { tool: "request", detail: "Checking what this project already has" },
  decidingPlan: { tool: "request", detail: "Working out whether this is a new app or a change" },
  writingQuestions: { tool: "questions", detail: "Writing a few questions about your business" },
  skippingQuestions: { tool: "request", detail: "This is a change to your app, starting it now" },
} as const satisfies Record<string, IntakeProgress>;
