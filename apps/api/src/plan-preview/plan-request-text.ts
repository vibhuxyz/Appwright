import type { PlanPreviewRequest } from "@repo/contracts";
import { structuredAnswers } from "@repo/planner";

export function planRequestText(request: PlanPreviewRequest): string {
  const chosen = structuredAnswers(request.answers, request.questions ?? [])
    .filter((item) => item.answer.length > 0)
    .map((item) => `${item.need}: ${item.answer}`);
  const feedback = request.feedback ? [`Change the plan: ${request.feedback}`] : [];
  return [request.prompt, ...chosen, ...feedback].join("\n\n");
}
