import { unlink } from "node:fs/promises";
import path from "node:path";
import { $ } from "bun";
import type { DiffFileResponse, MergeSessionResponse } from "@repo/contracts";
import { withRepoLock } from "./conflict/repo-lock";

interface HunkStats {
  additions: number;
  deletions: number;
}

function calculateHunkStats(diffText: string): HunkStats {
  let additions = 0;
  let deletions = 0;
  const lines = diffText.split("\n");
  for (const line of lines) {
    if (line.startsWith("+") && !line.startsWith("+++")) {
      additions++;
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      deletions++;
    }
  }
  return { additions, deletions };
}

function determineFileStatus(rawHeader: string): "added" | "modified" | "deleted" {
  if (rawHeader.includes("new file mode")) return "added";
  if (rawHeader.includes("deleted file mode")) return "deleted";
  return "modified";
}

export function parseGitDiff(rawDiff: string): DiffFileResponse[] {
  if (!rawDiff.trim()) return [];
  const fileChunks = rawDiff.split(/^diff --git /m).filter((c) => Boolean(c.trim()));
  const results: DiffFileResponse[] = [];

  for (const chunk of fileChunks) {
    const lines = chunk.split("\n");
    const headerLine = lines[0] ?? "";
    const match = headerLine.match(/a\/(.+?) b\/(.+?)$/);
    const filePath = match?.[2] ?? match?.[1] ?? "unknown";
    const status = determineFileStatus(chunk);
    const { additions, deletions } = calculateHunkStats(chunk);

    results.push({
      path: filePath,
      status,
      diff: `diff --git ${chunk}`,
      additions,
      deletions,
    });
  }

  return results;
}

export async function diffSession(
  repoDir: string,
  branchName: string,
): Promise<DiffFileResponse[]> {
  try {
    const rawDiff = await $`git -C ${repoDir} diff main...${branchName}`.text();
    return parseGitDiff(rawDiff);
  } catch {
    return [];
  }
}

function listedGitFiles(stderr: string, header: string): string[] {
  const idx = stderr.indexOf(header);
  if (idx === -1) return [];
  const files: string[] = [];
  for (const line of stderr.slice(idx + header.length).split("\n")) {
    if (line.startsWith("\t")) files.push(line.trim());
    else if (files.length > 0) break;
  }
  return files;
}

function resolvedInside(repoDir: string, relative: string): string | null {
  const root = path.resolve(repoDir);
  const full = path.resolve(root, relative);
  return full === root || full.startsWith(root + path.sep) ? full : null;
}

async function clearMergeBlockers(repoDir: string, stderr: string): Promise<boolean> {
  const untracked = listedGitFiles(
    stderr,
    "untracked working tree files would be overwritten",
  );
  const modified = listedGitFiles(
    stderr,
    "Your local changes to the following files would be overwritten",
  );
  if (untracked.length === 0 && modified.length === 0) return false;

  for (const file of untracked) {
    const full = resolvedInside(repoDir, file);
    if (full) await unlink(full).catch(() => {});
  }
  if (modified.length > 0) {
    await $`git -C ${repoDir} checkout -- ${modified}`.quiet().nothrow();
  }
  return true;
}

async function gitMerge(repoDir: string, branchName: string) {
  return $`git -C ${repoDir} merge --no-ff ${branchName} -m ${`merge ${branchName}`}`
    .quiet()
    .nothrow();
}

async function mergeSessionLocked(
  repoDir: string,
  branchName: string,
): Promise<MergeSessionResponse> {
  let result = await gitMerge(repoDir, branchName);
  if (result.exitCode !== 0) {
    const stderr = result.stderr.toString();
    if (await clearMergeBlockers(repoDir, stderr)) {
      result = await gitMerge(repoDir, branchName);
    }
  }
  if (result.exitCode === 0) {
    return { ok: true, conflict: false, message: "Merged cleanly" };
  }

  const conflictedArray = (await $`git -C ${repoDir} diff --name-only --diff-filter=U`
    .nothrow()
    .text())
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);
  await $`git -C ${repoDir} merge --abort`.quiet().nothrow();
  if (conflictedArray.length > 0) {
    return {
      ok: false,
      conflict: true,
      message: `Merge conflicts in: ${conflictedArray.join(", ")}`,
      conflicts: conflictedArray,
    };
  }
  const detail = result.stderr.toString().trim().split("\n").at(-1) ?? "merge failed";
  return { ok: false, conflict: false, message: detail };
}

export function mergeSession(
  repoDir: string,
  branchName: string,
): Promise<MergeSessionResponse> {
  return withRepoLock(repoDir, () => mergeSessionLocked(repoDir, branchName));
}

export async function revertSession(worktreeDir: string): Promise<boolean> {
  try {
    await $`git -C ${worktreeDir} reset --hard HEAD~1`.quiet();
    return true;
  } catch {
    return false;
  }
}

export interface GitCommitInfo {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  date: string;
}

export async function getRecentCommits(
  repoDir: string,
  limit = 5,
): Promise<GitCommitInfo[]> {
  try {
    const raw = await $`git -C ${repoDir} log -n ${limit} --format=%H|%h|%s|%an|%aI`
      .quiet()
      .text();
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const parts = line.split("|");
        return {
          sha: parts[0] ?? "",
          shortSha: parts[1] ?? "",
          message: parts[2] ?? "",
          author: parts[3] ?? "",
          date: parts[4] ?? "",
        };
      });
  } catch {
    return [];
  }
}

