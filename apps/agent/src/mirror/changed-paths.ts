export type PathChange = { path: string; kind: "upsert" | "delete" };

const STATUS_PREFIX_LENGTH = 3;
const RENAME_OR_COPY = new Set(["R", "C"]);
const READ_ONLY_COMMANDS = new Set(["ls", "cat", "grep", "rg", "find", "head", "tail", "pwd", "wc", "tree", "which"]);
const READ_ONLY_GIT_SUBCOMMANDS = new Set(["status", "diff", "log", "show", "rev-parse", "ls-files"]);

export function parsePorcelainZ(stdout: string): PathChange[] {
  const tokens = stdout.split("\0");
  const changes: PathChange[] = [];
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index] ?? "";
    if (token.length <= STATUS_PREFIX_LENGTH) continue;
    const indexStatus = token.charAt(0);
    const worktreeStatus = token.charAt(1);
    const path = token.slice(STATUS_PREFIX_LENGTH);
    if (RENAME_OR_COPY.has(indexStatus)) {
      const oldPath = tokens[index + 1] ?? "";
      index += 1;
      changes.push({ path, kind: "upsert" });
      if (indexStatus === "R" && oldPath) changes.push({ path: oldPath, kind: "delete" });
      continue;
    }
    const isDeleted = indexStatus === "D" || worktreeStatus === "D";
    changes.push({ path, kind: isDeleted ? "delete" : "upsert" });
  }
  return changes;
}

export function mightChangeFiles(argv: readonly string[]): boolean {
  const command = argv[0] ?? "";
  if (READ_ONLY_COMMANDS.has(command)) return false;
  if (command === "git") return !READ_ONLY_GIT_SUBCOMMANDS.has(argv[1] ?? "");
  return true;
}
