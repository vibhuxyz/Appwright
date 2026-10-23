import { execFile } from "node:child_process";
import { parsePorcelainZ } from "../../mirror";

const MAX_STATUS_BYTES = 1_000_000;

export function changedWorktreePaths(worktreeDir: string): Promise<string[] | null> {
  return new Promise((resolve) => {
    execFile(
      "git",
      ["-C", worktreeDir, "status", "--porcelain=v1", "-z"],
      { maxBuffer: MAX_STATUS_BYTES },
      (error, stdout) => {
        if (error) {
          resolve(null);
          return;
        }
        resolve(parsePorcelainZ(stdout).flatMap((change) => (change.kind === "delete" ? [] : [change.path])));
      },
    );
  });
}
