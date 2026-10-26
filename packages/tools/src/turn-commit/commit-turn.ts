import path from "node:path";
import { ENV_FILES_EXCLUDED, git, lastLine } from "./git-run";

const ENV_EXAMPLE = ".env.example";
const MAX_SUBJECT_CHARS = 60;

export type CommitTurnResult =
  | { readonly kind: "committed"; readonly sha: string }
  | { readonly kind: "nothing-to-commit" }
  | { readonly kind: "failed"; readonly message: string };

function subjectFor(prompt: string): string {
  const firstLine = (prompt.split("\n")[0] ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_SUBJECT_CHARS);
  return `agent: ${firstLine || "turn"}`;
}

async function stageTurn(worktreeDir: string): Promise<string | undefined> {
  const staged = await git(worktreeDir, ["add", "-A", "--", ".", ENV_FILES_EXCLUDED]);
  if (!staged.ok) return lastLine(staged.stderr);
  if (!(await Bun.file(path.join(worktreeDir, ENV_EXAMPLE)).exists())) return undefined;
  const example = await git(worktreeDir, ["add", "--", ENV_EXAMPLE]);
  return example.ok ? undefined : lastLine(example.stderr);
}

export async function commitTurn(worktreeDir: string, prompt: string): Promise<CommitTurnResult> {
  const stageError = await stageTurn(worktreeDir);
  if (stageError) return { kind: "failed", message: `Cannot stage turn in ${worktreeDir}: ${stageError}` };
  const hasChanges = !(await git(worktreeDir, ["diff", "--cached", "--quiet"])).ok;
  if (!hasChanges) return { kind: "nothing-to-commit" };
  const commit = await git(worktreeDir, ["commit", "--no-verify", "-m", subjectFor(prompt)]);
  if (!commit.ok) return { kind: "failed", message: `Cannot commit turn in ${worktreeDir}: ${lastLine(commit.stderr)}` };
  const head = await git(worktreeDir, ["rev-parse", "HEAD"]);
  if (!head.ok) return { kind: "failed", message: `Cannot read HEAD in ${worktreeDir}: ${lastLine(head.stderr)}` };
  return { kind: "committed", sha: head.stdout };
}
