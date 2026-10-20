import { $ } from "bun";
import { listConflictedPaths } from "./detect";
import { withRepoLock } from "./repo-lock";
import type { ConflictResolution, ResolveResult } from "./types";

const OURS_FLAG_BY_SIDE = {
  main: "--ours",
  session: "--theirs",
} as const;

async function abortMerge(repoDir: string): Promise<void> {
  await $`git -C ${repoDir} merge --abort`.quiet().nothrow();
}

async function applySide(
  repoDir: string,
  resolution: ConflictResolution,
): Promise<void> {
  const flag = OURS_FLAG_BY_SIDE[resolution.side];
  const checkout =
    await $`git -C ${repoDir} checkout ${flag} -- ${resolution.path}`
      .quiet()
      .nothrow();
  if (checkout.exitCode === 0) {
    await $`git -C ${repoDir} add -- ${resolution.path}`.quiet();
    return;
  }
  await $`git -C ${repoDir} rm --quiet -- ${resolution.path}`.quiet();
}

function findProblems(
  conflicted: readonly string[],
  resolutions: readonly ConflictResolution[],
): Pick<
  Extract<ResolveResult, { ok: false }>,
  "reason" | "message" | "unresolved"
> | null {
  const conflictedSet = new Set(conflicted);
  const chosen = new Set(resolutions.map((r) => r.path));
  const unknown = [...chosen].filter((p) => !conflictedSet.has(p));
  if (unknown.length > 0) {
    return {
      reason: "unknown-path",
      message: `Not conflicted: ${unknown.join(", ")}`,
      unresolved: unknown,
    };
  }
  const missing = conflicted.filter((p) => !chosen.has(p));
  if (missing.length > 0) {
    return {
      reason: "unresolved",
      message: `Pick a side for: ${missing.join(", ")}`,
      unresolved: missing,
    };
  }
  return null;
}

async function resolveLocked(
  repoDir: string,
  branchName: string,
  resolutions: readonly ConflictResolution[],
): Promise<ResolveResult> {
  const conflicted = await listConflictedPaths(repoDir, branchName);
  if (conflicted.length === 0) {
    return { ok: false, reason: "no-conflict", message: "Nothing to resolve" };
  }
  const problem = findProblems(conflicted, resolutions);
  if (problem) return { ok: false, ...problem };

  await $`git -C ${repoDir} merge --no-ff --no-commit ${branchName}`
    .quiet()
    .nothrow();
  try {
    for (const resolution of resolutions) {
      await applySide(repoDir, resolution);
    }
    await $`git -C ${repoDir} commit -m ${`merge ${branchName} (conflicts resolved)`}`.quiet();
  } catch (error) {
    await abortMerge(repoDir);
    const detail = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      reason: "failed",
      message: `Cannot resolve conflicts for ${branchName}: ${detail}`,
    };
  }
  return { ok: true, message: `Merged ${branchName} with chosen sides` };
}

export function resolveConflicts(
  repoDir: string,
  branchName: string,
  resolutions: readonly ConflictResolution[],
): Promise<ResolveResult> {
  return withRepoLock(repoDir, () =>
    resolveLocked(repoDir, branchName, resolutions),
  );
}
