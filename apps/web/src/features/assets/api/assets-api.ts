import {
  AssetRequestResponse,
  GenerateAssetRequest,
  ListProjectAssetsResponse,
  ProjectAssetResponse,
} from "@repo/contracts";
import { httpClient } from "@/shared/lib/httpClient";
import { z } from "zod";

export const assetsApi = {
  listAssetRequests: (sessionId: string) =>
    httpClient.get(`/asset-requests/${sessionId}`).then((r) => z.array(AssetRequestResponse).parse(r)),
  uploadSlot: (assetRequestId: string, slotId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return httpClient
      .postForm(`/asset-requests/${assetRequestId}/slots/${slotId}/upload`, formData)
      .then(ProjectAssetResponse.parse);
  },
  generateSlot: (assetRequestId: string, slotId: string, prompt: string) =>
    httpClient
      .post(`/asset-requests/${assetRequestId}/slots/${slotId}/generate`, GenerateAssetRequest.parse({ prompt }))
      .then(ProjectAssetResponse.parse),
  skipSlot: (assetRequestId: string, slotId: string) =>
    httpClient
      .post(`/asset-requests/${assetRequestId}/slots/${slotId}/skip`)
      .then(AssetRequestResponse.parse),
  listProjectAssets: (projectId: string, cursor?: string) =>
    httpClient
      .get(`/projects/${projectId}/assets${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`)
      .then(ListProjectAssetsResponse.parse),
};
