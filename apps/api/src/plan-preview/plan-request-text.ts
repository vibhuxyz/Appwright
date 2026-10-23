import type { PlanPreviewRequest } from "@repo/contracts";
import { requirementTurns } from "@repo/planner";

export function planRequestText(request: PlanPreviewRequest): string {
  const turns = requirementTurns(request.answers, request.questions).map((turn) => turn.content);
  const feedback = request.feedback ? [`Change the plan: ${request.feedback}`] : [];
  return [request.prompt, ...turns, ...feedback].join("\n\n");
}
