import type { AssetPurpose } from "@repo/contracts";
import type { AssetSourceFolder } from "./types";

export function buildAssetFolder(
  userId: string,
  projectId: string,
  source: AssetSourceFolder,
  purpose: AssetPurpose,
): string {
  return `appwright/${userId}/${projectId}/${source}/${purpose}`;
}
