import { safeResolve } from "@repo/contracts/files";
import type { AssetPurpose } from "@repo/contracts";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { commitSessionCheckpoint } from "../workflow/commit-checkpoint";

export interface WriteAssetToWorktreeInput {
  readonly projectId: string;
  readonly worktreeSessionId: string;
  readonly purpose: AssetPurpose;
  readonly assetId: string;
  readonly extension: string;
  readonly bytes: Uint8Array;
}

export async function writeAssetToWorktree(input: WriteAssetToWorktreeInput): Promise<string> {
  const relPath = `public/assets/${input.purpose}/${input.assetId}.${input.extension}`;
  const fullPath = safeResolve(
    input.projectId,
    relPath,
    input.worktreeSessionId,
  );

  await mkdir(path.dirname(fullPath), { recursive: true });
  await Bun.write(fullPath, input.bytes);
  await commitSessionCheckpoint(
    input.projectId,
    input.worktreeSessionId,
    `asset: ${input.purpose}/${input.assetId}`,
  );

  return `/assets/${input.purpose}/${input.assetId}.${input.extension}`;
}
