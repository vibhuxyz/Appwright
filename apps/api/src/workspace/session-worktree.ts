import { existsSync } from "node:fs";
import { lstat, unlink } from "node:fs/promises";
import path from "node:path";
import { $ } from "bun";
import {
  projectRepoPath,
  sessionBranchName,
  sessionWorktreePath,
} from "@repo/workspace";

const inflight = new Map<string, Promise<string>>();

export async function createSessionWorktree(
  projectId: string,
  worktreeSessionId: string,
): Promise<string> {
  const key = `${projectId}:${worktreeSessionId}`;
  const pending = inflight.get(key);
  if (pending) return pending;
  const created = addWorktree(projectId, worktreeSessionId).finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, created);
  return created;
}

async function addWorktree(
  projectId: string,
  worktreeSessionId: string,
): Promise<string> {
  const repoDir = projectRepoPath(projectId);
  const worktreeDir = sessionWorktreePath(projectId, worktreeSessionId);
  const branchName = sessionBranchName(worktreeSessionId);

  if (existsSync(worktreeDir)) {
    await unlinkNodeModulesSymlink(worktreeDir);
    return worktreeDir;
  }

  if (await branchExists(repoDir, branchName)) {
    await checkoutWorktree(repoDir, worktreeDir, branchName);
  } else {
    await createBranchWorktree(repoDir, worktreeDir, branchName);
  }

  await unlinkNodeModulesSymlink(worktreeDir);
  return worktreeDir;
}

async function createBranchWorktree(
  repoDir: string,
  worktreeDir: string,
  branchName: string,
): Promise<void> {
  const added = await git(repoDir, [
    "worktree",
    "add",
    worktreeDir,
    "-b",
    branchName,
    "main",
  ]);
  if (added.ok || existsSync(worktreeDir)) return;
  if (await branchExists(repoDir, branchName)) {
    await checkoutWorktree(repoDir, worktreeDir, branchName);
    return;
  }
  throw new Error(
    `git worktree add failed for ${worktreeDir}: ${added.stderr}`,
  );
}

async function checkoutWorktree(
  repoDir: string,
  worktreeDir: string,
  branchName: string,
): Promise<void> {
  const added = await git(repoDir, [
    "worktree",
    "add",
    worktreeDir,
    branchName,
  ]);
  if (added.ok || existsSync(worktreeDir)) return;
  throw new Error(
    `git worktree add failed for ${worktreeDir}: ${added.stderr}`,
  );
}

async function branchExists(
  repoDir: string,
  branchName: string,
): Promise<boolean> {
  const result = await git(repoDir, [
    "rev-parse",
    "--verify",
    "--quiet",
    `refs/heads/${branchName}`,
  ]);
  return result.ok;
}

async function git(
  repoDir: string,
  args: readonly string[],
): Promise<{ ok: boolean; stderr: string }> {
  const result = await $`git -C ${repoDir} ${args}`.quiet().nothrow();
  return {
    ok: result.exitCode === 0,
    stderr: result.stderr.toString().trim(),
  };
}

function isEnoent(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    err.code === "ENOENT"
  );
}

export async function unlinkNodeModulesSymlink(dir: string): Promise<void> {
  const modules = path.join(dir, "node_modules");
  try {
    const st = await lstat(modules);
    if (st.isSymbolicLink()) {
      await unlink(modules);
    }
  } catch (err) {
    if (isEnoent(err)) return;
    throw err;
  }
}
