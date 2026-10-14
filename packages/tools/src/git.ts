import { $ } from "bun";
import type { DiffFileResponse, MergeSessionResponse } from "@repo/contracts";

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

export async function mergeSession(
  repoDir: string,
  branchName: string,
): Promise<MergeSessionResponse> {
  try {
    await $`git -C ${repoDir} merge --no-ff ${branchName} -m ${`merge ${branchName}`}`.quiet();
    return { ok: true, conflict: false, message: "Merged cleanly" };
  } catch {
    const conflictFiles = await $`git -C ${repoDir} diff --name-only --diff-filter=U`
      .text()
      .catch(() => "");
    await $`git -C ${repoDir} merge --abort`.quiet().catch(() => {});
    const conflictedArray = conflictFiles
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);
    const conflictedList = conflictedArray.join(", ");
    return {
      ok: false,
      conflict: true,
      message:
        conflictedList.length > 0
          ? `Merge conflicts in: ${conflictedList}`
          : "Merge failed due to conflicts",
      conflicts: conflictedArray,
    };
  }
}

export async function revertSession(worktreeDir: string): Promise<boolean> {
  try {
    await $`git -C ${worktreeDir} reset --hard HEAD~1`.quiet();
    return true;
  } catch {
    return false;
  }
}
