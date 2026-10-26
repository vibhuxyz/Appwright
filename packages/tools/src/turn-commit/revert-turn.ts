import { mergeSession } from "../git";
import { ENV_FILES_EXCLUDED, git, lastLine } from "./git-run";

const MAIN_BRANCH = "main";

export interface RevertTurnInput {
  readonly worktreeDir: string;
  readonly repoDir: string;
  readonly branchName: string;
  readonly sha: string;
}

export type MainOutcome =
  | { readonly kind: "updated" }
  | { readonly kind: "not-on-main" }
  | { readonly kind: "failed"; readonly message: string };

export type RevertTurnResult =
  | { readonly ok: true; readonly revertSha: string; readonly main: MainOutcome }
  | { readonly ok: false; readonly reason: "dirty" | "not-on-branch" | "conflict" | "failed"; readonly message: string };

async function isAncestor(dir: string, sha: string, ref: string): Promise<boolean> {
  return (await git(dir, ["merge-base", "--is-ancestor", sha, ref])).ok;
}

async function preflight(input: RevertTurnInput): Promise<RevertTurnResult | undefined> {
  const status = await git(input.worktreeDir, ["status", "--porcelain", "--", ".", ENV_FILES_EXCLUDED]);
  if (!status.ok) return { ok: false, reason: "failed", message: `Cannot read git status: ${lastLine(status.stderr)}` };
  if (status.stdout.length > 0) {
    return { ok: false, reason: "dirty", message: "This chat has uncommitted changes, so a revert could delete work. Nothing was changed." };
  }
  if (!(await isAncestor(input.worktreeDir, input.sha, "HEAD"))) {
    return { ok: false, reason: "not-on-branch", message: `Commit ${input.sha.slice(0, 8)} is not on this chat's branch. Nothing was changed.` };
  }
  return undefined;
}

export async function revertTurn(input: RevertTurnInput): Promise<RevertTurnResult> {
  const blocked = await preflight(input);
  if (blocked) return blocked;
  const wasOnMain = await isAncestor(input.repoDir, input.sha, MAIN_BRANCH);
  const reverted = await git(input.worktreeDir, ["revert", "--no-edit", input.sha]);
  if (!reverted.ok) {
    await git(input.worktreeDir, ["revert", "--abort"]);
    return { ok: false, reason: "conflict", message: `Later changes depend on this turn, so it cannot be undone on its own: ${lastLine(reverted.stderr)}` };
  }
  const head = await git(input.worktreeDir, ["rev-parse", "HEAD"]);
  if (!head.ok) return { ok: false, reason: "failed", message: `Reverted, but cannot read HEAD: ${lastLine(head.stderr)}` };
  if (!wasOnMain) return { ok: true, revertSha: head.stdout, main: { kind: "not-on-main" } };
  const merged = await mergeSession(input.repoDir, input.branchName);
  const main: MainOutcome = merged.ok ? { kind: "updated" } : { kind: "failed", message: merged.message };
  return { ok: true, revertSha: head.stdout, main };
}
