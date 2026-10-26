import type { Provider } from "@repo/agent-core";
import { buildBlueprint, persistBlueprint } from "@repo/blueprint";
import type { PlanPreview, PlanPreviewRequest } from "@repo/contracts";
import { detectAssetSlots } from "@repo/media";
import type { IntakeProgress } from "../intake";
import { toPlannerProgress } from "./plan-progress";
import { planRequestText } from "./plan-request-text";
import { summarizePlan } from "./summarize-plan";

export async function createPlanPreview(input: {
  sessionId: string;
  request: PlanPreviewRequest;
  provider: Provider;
  onProgress: (progress: IntakeProgress) => void;
}): Promise<PlanPreview> {
  const plan = await buildBlueprint(planRequestText(input.request), {
    provider: input.provider,
    onProgress: (progress) => input.onProgress(toPlannerProgress(progress)),
  });
  const persisted = await persistBlueprint(input.sessionId, plan);
  return summarizePlan(persisted.blueprintId, plan.blueprint, detectAssetSlots(plan.blueprint));
}
