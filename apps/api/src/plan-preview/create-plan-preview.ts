import type { Provider } from "@repo/agent-core";
import { buildBlueprint, persistBlueprint } from "@repo/blueprint";
import type { PlanPreview, PlanPreviewRequest } from "@repo/contracts";
import { detectAssetSlots } from "@repo/media";
import { planRequestText } from "./plan-request-text";
import { summarizePlan } from "./summarize-plan";

export async function createPlanPreview(
  sessionId: string,
  request: PlanPreviewRequest,
  provider: Provider,
): Promise<PlanPreview> {
  const plan = await buildBlueprint(planRequestText(request), { provider });
  const persisted = await persistBlueprint(sessionId, plan);
  return summarizePlan(persisted.blueprintId, plan.blueprint, detectAssetSlots(plan.blueprint));
}
