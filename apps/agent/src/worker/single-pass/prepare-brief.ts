import { buildSinglePassBrief, loadSessionAssetSlots } from "@repo/blueprint";
import type { Blueprint } from "@repo/contracts";
import { createLogger } from "@repo/logger";

const log = createLogger("single-pass");

export async function prepareSinglePassBrief(sessionId: string, blueprint: Blueprint): Promise<string> {
  const { slots, skipped } = await loadSessionAssetSlots(sessionId);
  if (skipped.length > 0) log.warn("skipped invalid asset slots", { sessionId, skipped });
  const brief = buildSinglePassBrief({ blueprint, slots });
  if (brief.cutLines > 0) log.warn("single-pass brief trimmed", { sessionId, cutLines: brief.cutLines });
  return brief.text;
}
