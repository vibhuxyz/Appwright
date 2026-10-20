import { AssetRequestResponse, AssetSlotSchema, ProjectAssetResponse } from "@repo/contracts";
import { z } from "zod";

const SlotsSchema = z.array(AssetSlotSchema);

export function serializeAssetRequest(row: {
  id: string;
  sessionId: string;
  blueprintId: string;
  slots: unknown;
  status: string;
  createdAt: Date;
  resolvedAt: Date | null;
}): AssetRequestResponse {
  return AssetRequestResponse.parse({
    id: row.id,
    sessionId: row.sessionId,
    blueprintId: row.blueprintId,
    slots: SlotsSchema.parse(row.slots),
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
  });
}

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
  createdAt: Date;
}): ProjectAssetResponse {
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
    createdAt: row.createdAt.toISOString(),
  });
}
