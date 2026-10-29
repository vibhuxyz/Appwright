import { z } from "zod";

const PlanFeedbackDataSchema = z.object({ planFeedback: z.array(z.string()).min(1) });

export function hasPlanFeedbackData(data: unknown): boolean {
  return PlanFeedbackDataSchema.safeParse(data).success;
}
