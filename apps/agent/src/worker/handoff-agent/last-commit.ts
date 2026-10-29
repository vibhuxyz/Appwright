import { execFile } from "node:child_process";
import { MAX_COMMIT_CHARS } from "./constants";

const GIT_TIMEOUT_MS = 5_000;
const NO_COMMIT = "No commit recorded yet.";

export function lastCommitLine(worktreeDir: string): Promise<string> {
  return new Promise((resolve) => {
    execFile(
      "git",
      ["-C", worktreeDir, "log", "-1", "--format=%h %s"],
      { timeout: GIT_TIMEOUT_MS },
      (error, stdout) => {
        if (error) {
          resolve(NO_COMMIT);
          return;
        }
        const line = stdout.replace(/\s+/g, " ").trim();
        resolve(line.length > 0 ? line.slice(0, MAX_COMMIT_CHARS) : NO_COMMIT);
      },
    );
  });
}
