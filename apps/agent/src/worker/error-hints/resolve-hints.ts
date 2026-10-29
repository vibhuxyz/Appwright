import { realpath, stat } from "node:fs/promises";
import path from "node:path";
import type { ErrorHintFile } from "@repo/contracts";

export interface SkippedHint {
  path: string;
  reason: "outside-worktree" | "not-found" | "not-a-file";
}

export interface ResolvedHints {
  files: ErrorHintFile[];
  skipped: SkippedHint[];
}

function isNotFound(error: unknown): boolean {
  return error instanceof Error && "code" in error && (error.code === "ENOENT" || error.code === "ENOTDIR");
}

function isInside(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return relative.length > 0 && !relative.startsWith("..") && !path.isAbsolute(relative);
}

async function checkHint(root: string, hint: ErrorHintFile): Promise<SkippedHint["reason"] | null> {
  const joined = path.resolve(root, hint.path);
  if (!isInside(root, joined)) return "outside-worktree";
  try {
    const real = await realpath(joined);
    if (!isInside(root, real)) return "outside-worktree";
    return (await stat(real)).isFile() ? null : "not-a-file";
  } catch (error) {
    if (isNotFound(error)) return "not-found";
    throw error;
  }
}

export async function resolveHints(worktreeDir: string, hints: readonly ErrorHintFile[]): Promise<ResolvedHints> {
  const root = await realpath(worktreeDir);
  const reasons = await Promise.all(hints.map((hint) => checkHint(root, hint)));
  const files: ErrorHintFile[] = [];
  const skipped: SkippedHint[] = [];
  hints.forEach((hint, index) => {
    const reason = reasons[index];
    if (reason) skipped.push({ path: hint.path, reason });
    else files.push(hint);
  });
  return { files, skipped };
}
