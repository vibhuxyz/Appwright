import { execFile } from "node:child_process";
import { copyOnlyPaths, type ChangeScope } from "@repo/browser";
import { parsePorcelainZ } from "../../mirror";

const MAX_STATUS_BYTES = 1_000_000;
const MAX_DIFF_BYTES = 2_000_000;
const STATUS_PREFIX_LENGTH = 3;
const RENAME_OR_COPY = new Set(["R", "C"]);

export function addedPathsFromStatus(stdout: string): string[] {
  const tokens = stdout.split("\0");
  const added: string[] = [];
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index] ?? "";
    if (token.length <= STATUS_PREFIX_LENGTH) continue;
    const status = token.slice(0, 2);
    if (RENAME_OR_COPY.has(status.charAt(0))) index += 1;
    if (status === "??" || status.charAt(0) === "A") added.push(token.slice(STATUS_PREFIX_LENGTH));
  }
  return added;
}

function trackedDiff(worktreeDir: string): Promise<string> {
  return new Promise((resolve) => {
    execFile(
      "git",
      ["-C", worktreeDir, "diff", "--unified=0", "--no-color", "--no-ext-diff", "HEAD"],
      { maxBuffer: MAX_DIFF_BYTES },
      (error, stdout) => resolve(error ? "" : stdout),
    );
  });
}

function statusScope(worktreeDir: string): Promise<ChangeScope | null> {
  return new Promise((resolve) => {
    execFile(
      "git",
      ["-C", worktreeDir, "status", "--porcelain=v1", "-z", "--untracked-files=all"],
      { maxBuffer: MAX_STATUS_BYTES },
      (error, stdout) => {
        if (error) {
          resolve(null);
          return;
        }
        const changedPaths = parsePorcelainZ(stdout).flatMap((change) => (change.kind === "delete" ? [] : [change.path]));
        resolve({ changedPaths, addedPaths: addedPathsFromStatus(stdout) });
      },
    );
  });
}

export async function worktreeChangeScope(worktreeDir: string): Promise<ChangeScope | null> {
  const [scope, diff] = await Promise.all([statusScope(worktreeDir), trackedDiff(worktreeDir)]);
  return scope ? { ...scope, copyOnlyPaths: copyOnlyPaths(diff) } : null;
}
