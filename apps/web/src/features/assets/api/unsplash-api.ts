import {
  AssetRequestResponse,
  SelectUnsplashPhotoRequest,
  UnsplashSearchResponse,
  type UnsplashPhoto,
} from "@repo/contracts";
import { httpClient } from "@/shared/lib/httpClient";
import { assetSlotPath } from "./asset-slot-path";
import { photoSearchPath, type PhotoSearchParams } from "./photo-search-path";

export const unsplashApi = {
  search: (params: PhotoSearchParams, signal?: AbortSignal) =>
    httpClient.get(photoSearchPath(params), signal).then(UnsplashSearchResponse.parse),
  selectForSlot: (assetRequestId: string, slotId: string, photo: UnsplashPhoto) =>
    httpClient
      .post(assetSlotPath(assetRequestId, slotId, "unsplash"), SelectUnsplashPhotoRequest.parse({ photo }))
      .then(AssetRequestResponse.parse),
};
