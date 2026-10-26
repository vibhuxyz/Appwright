import { loadImageReply, waitUntilAssetRequestResolved } from "@repo/assets";
import {
  formatQuestionReplyContent,
  imageQuestionSet,
  type AssetRequestResponse,
  type AssetSlot,
} from "@repo/contracts";
import { publishStatus, type PersistFields } from "../persist";

const IMAGE_REQUEST_INTRO =
  "Choose an image for each section: upload your own, generate one, or decide for me and I will pick a matching photo for that section and this business.";

function pendingSlots(slots: readonly AssetSlot[]): AssetSlot[] {
  return slots.filter((slot) => slot.status !== "RESOLVED" && slot.status !== "SKIPPED");
}

export async function waitForSectionImages(input: {
  sessionId: string;
  assetRequest: AssetRequestResponse | null;
  signal: AbortSignal;
  persist: (fields: PersistFields) => Promise<unknown>;
}): Promise<"resolved" | "cancelled"> {
  const { sessionId, assetRequest, signal, persist } = input;
  if (!assetRequest || assetRequest.status === "RESOLVED") return "resolved";
  await persist({
    role: "assistant",
    type: "text",
    content: IMAGE_REQUEST_INTRO,
    data: { questionSet: imageQuestionSet(IMAGE_REQUEST_INTRO, pendingSlots(assetRequest.slots)) },
  });
  publishStatus(sessionId, "RUNNING", "Waiting for section images…");
  try {
    await waitUntilAssetRequestResolved(assetRequest.id, signal);
  } catch (error) {
    if (signal.aborted) return "cancelled";
    throw new Error(`Waiting for section images failed for asset request ${assetRequest.id}`, { cause: error });
  }
  const reply = await loadImageReply(assetRequest.id);
  if (reply) {
    await persist({ role: "user", type: "text", content: formatQuestionReplyContent(reply), data: { questionReply: reply } });
  }
  return "resolved";
}
