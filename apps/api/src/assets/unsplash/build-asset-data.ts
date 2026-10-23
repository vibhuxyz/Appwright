import type { AssetPurpose, UnsplashAttribution, UnsplashPhoto } from "@repo/contracts";

export const UNSPLASH_PUBLIC_ID_PREFIX = "unsplash:";

export interface UnsplashAssetDataInput {
  readonly projectId: string;
  readonly sessionId: string;
  readonly purpose: AssetPurpose;
  readonly altText: string;
  readonly searchText: string;
  readonly photo: UnsplashPhoto;
}

export function buildUnsplashAssetData(input: UnsplashAssetDataInput) {
  const { photo } = input;
  return {
    projectId: input.projectId,
    sessionId: input.sessionId,
    purpose: input.purpose,
    source: "SEARCHED" as const,
    prompt: input.searchText,
    cloudinaryPublicId: `${UNSPLASH_PUBLIC_ID_PREFIX}${photo.id}`,
    cloudinaryUrl: photo.regularUrl,
    localPath: photo.regularUrl,
    altText: input.altText,
    externalId: photo.id,
    attribution: photo.attribution satisfies UnsplashAttribution,
  };
}
