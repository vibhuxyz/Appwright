import {
  AssetRequestResponse,
  GenerateAssetRequest,
  ListProjectAssetsResponse,
  ProjectAssetResponse,
} from "@repo/contracts";
import { httpClient } from "@/shared/lib/httpClient";
import { z } from "zod";
import { assetSlotPath } from "./asset-slot-path";

export const assetsApi = {
  listAssetRequests: (sessionId: string) =>
    httpClient
      .get(`/asset-requests/${encodeURIComponent(sessionId)}`)
      .then((r) => z.array(AssetRequestResponse).parse(r)),
  uploadSlot: (assetRequestId: string, slotId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return httpClient
      .postForm(assetSlotPath(assetRequestId, slotId, "upload"), formData)
      .then(ProjectAssetResponse.parse);
  },
  generateSlot: (assetRequestId: string, slotId: string, prompt: string) =>
    httpClient
      .post(assetSlotPath(assetRequestId, slotId, "generate"), GenerateAssetRequest.parse({ prompt }))
      .then(ProjectAssetResponse.parse),
  skipSlot: (assetRequestId: string, slotId: string) =>
    httpClient.post(assetSlotPath(assetRequestId, slotId, "skip")).then(AssetRequestResponse.parse),
  stockSlot: (assetRequestId: string, slotId: string) =>
    httpClient.post(assetSlotPath(assetRequestId, slotId, "stock")).then(AssetRequestResponse.parse),
  fillRemainingStock: (assetRequestId: string) =>
    httpClient.post(`/asset-requests/${assetRequestId}/stock`).then(AssetRequestResponse.parse),
  listProjectAssets: (projectId: string, cursor?: string) =>
    httpClient
      .get(`/projects/${projectId}/assets${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`)
      .then(ListProjectAssetsResponse.parse),
};
