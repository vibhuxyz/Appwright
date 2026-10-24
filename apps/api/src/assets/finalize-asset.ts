import type { AssetPurpose, AssetSource } from "@repo/contracts";
import { prisma } from "@repo/db";
import { buildAssetFolder, uploadAsset } from "@repo/media";
import { worktreeSessionIdOf } from "@repo/workspace";
import { markSlotResolved } from "./mark-slot-resolved";
import { writeAssetToWorktree } from "./write-to-worktree";

const EXTENSION_BY_MIME: Readonly<Record<string, string>> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};
const DEFAULT_EXTENSION = "png";

export interface FinalizeAssetInput {
  readonly userId: string;
  readonly projectId: string;
  readonly sessionId: string;
  readonly assetRequestId: string;
  readonly slotId: string;
  readonly purpose: AssetPurpose;
  readonly altText: string;
  readonly source: AssetSource;
  readonly prompt?: string;
  readonly bytes: Uint8Array;
  readonly mimeType: string;
}

export async function finalizeAsset(input: FinalizeAssetInput) {
  const extension = EXTENSION_BY_MIME[input.mimeType] ?? DEFAULT_EXTENSION;
  const sourceFolder =
    input.source === "UPLOADED" ? "uploads" : input.source === "SEARCHED" ? "stock" : "generated";
  const folder = buildAssetFolder(input.userId, input.projectId, sourceFolder, input.purpose);
  const publicId = input.slotId.replace(/[^a-zA-Z0-9_-]/g, "_");

  const [uploaded, session] = await Promise.all([
    uploadAsset({
      bytes: input.bytes,
      mimeType: input.mimeType,
      folder,
      publicId,
    }),
    prisma.session.findUniqueOrThrow({
      where: { id: input.sessionId },
      select: { id: true, branch: true },
    }),
  ]);

  const localPath = await writeAssetToWorktree({
    projectId: input.projectId,
    worktreeSessionId: worktreeSessionIdOf(session),
    purpose: input.purpose,
    assetId: publicId,
    extension,
    bytes: input.bytes,
  });

  const asset = await prisma.projectAsset.create({
    data: {
      projectId: input.projectId,
      sessionId: input.sessionId,
      purpose: input.purpose,
      source: input.source,
      prompt: input.prompt ?? null,
      cloudinaryPublicId: uploaded.publicId,
      cloudinaryUrl: uploaded.url,
      localPath,
      altText: input.altText,
    },
  });

  const assetRequest = await markSlotResolved({
    assetRequestId: input.assetRequestId,
    slotId: input.slotId,
    status: "RESOLVED",
    assetId: asset.id,
    finalPath: localPath,
  });

  return { asset, assetRequest };
}
