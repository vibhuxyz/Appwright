import type { Runtime } from "@repo/agent-core";
import { buildSinglePassBrief, deliverBlueprintPatterns, loadSessionAssetSlots } from "@repo/blueprint";
import type { Blueprint } from "@repo/contracts";
import { createLogger } from "@repo/logger";

const log = createLogger("single-pass");

export async function prepareSinglePassBrief(
  sessionId: string,
  projectId: string,
  blueprint: Blueprint,
  runtime: Runtime,
): Promise<string> {
  const [{ slots, skipped }, projectTree] = await Promise.all([loadSessionAssetSlots(sessionId), runtime.listDir(".")]);
  if (skipped.length > 0) log.warn("skipped invalid asset slots", { sessionId, skipped });
  const delivery = await deliverBlueprintPatterns({ blueprint, projectId }, runtime, projectTree);
  log.info("patterns delivered", { sessionId, written: delivery.written, skipped: delivery.skipped });
  const brief = buildSinglePassBrief({ blueprint, slots, projectId, delivery });
  if (brief.cutLines > 0) log.warn("single-pass brief trimmed", { sessionId, cutLines: brief.cutLines });
  return brief.text;
}
