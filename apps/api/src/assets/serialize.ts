import { ProjectAssetResponse, UnsplashAttribution } from "@repo/contracts";

export function serializeProjectAsset(row: {
  id: string;
  projectId: string;
  sessionId: string;
  purpose: string;
  source: string;
  prompt: string | null;
  cloudinaryUrl: string;
  localPath: string;
  altText: string;
  externalId: string | null;
  attribution: unknown;
  createdAt: Date;
}): ProjectAssetResponse {
  const attribution = UnsplashAttribution.safeParse(row.attribution);
  return ProjectAssetResponse.parse({
    id: row.id,
    projectId: row.projectId,
    sessionId: row.sessionId,
    purpose: row.purpose,
    source: row.source,
    prompt: row.prompt,
    url: row.cloudinaryUrl,
    localPath: row.localPath,
    altText: row.altText,
    externalId: row.externalId,
    attribution: attribution.success ? attribution.data : null,
    createdAt: row.createdAt.toISOString(),
  });
}
