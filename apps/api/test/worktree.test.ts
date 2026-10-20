import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { lstat, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { $ } from "bun";
import {
  createSessionWorktree,
  initProjectGit,
  projectRepoPath,
  pruneWorktrees,
  removeSessionWorktree,
  sessionWorktreePath,
  WORKSPACES_DIR,
} from "../src/workspace/manager";

describe("Git Worktree Workspace Isolation (V2 Slice 1)", () => {
  const testProjectId = `test-proj-${Date.now()}`;
  const testSessionId = `test-sess-${Date.now()}`;
  const repoDir = projectRepoPath(testProjectId);
  const worktreeDir = sessionWorktreePath(testProjectId, testSessionId);

  beforeAll(async () => {
    // Create base repo directory and a dummy file
    await mkdir(repoDir, { recursive: true });
    await writeFile(path.join(repoDir, "README.md"), "# Test Project\n");
    await initProjectGit(repoDir);
  });

  afterAll(async () => {
    // Clean up entire test project folder
    await rm(path.join(WORKSPACES_DIR, testProjectId), {
      recursive: true,
      force: true,
    });
  });

  it("initProjectGit initializes main branch and initial commit", async () => {
    const branch = (
      await $`git -C ${repoDir} branch --show-current`.text()
    ).trim();
    expect(branch).toBe("main");

    const commitLog = (
      await $`git -C ${repoDir} log -1 --pretty=%B`.text()
    ).trim();
    expect(commitLog).toBe("initial template");
  });

  it("createSessionWorktree creates an isolated worktree on branch agent/<sessionId>", async () => {
    const createdPath = await createSessionWorktree(
      testProjectId,
      testSessionId,
    );
    expect(createdPath).toBe(worktreeDir);
    expect(existsSync(worktreeDir)).toBe(true);

    const worktreeBranch = (
      await $`git -C ${worktreeDir} branch --show-current`.text()
    ).trim();
    expect(worktreeBranch).toBe(`agent/${testSessionId}`);
  });

  it("createSessionWorktree is idempotent when called again", async () => {
    const secondCallPath = await createSessionWorktree(
      testProjectId,
      testSessionId,
    );
    expect(secondCallPath).toBe(worktreeDir);
    expect(existsSync(worktreeDir)).toBe(true);
  });

  it("does not symlink repo node_modules into the session worktree", async () => {
    const sessionId = `test-sess-nm-${Date.now()}`;
    const wt = sessionWorktreePath(testProjectId, sessionId);
    await mkdir(path.join(repoDir, "node_modules"), { recursive: true });
    await writeFile(path.join(repoDir, "node_modules", "marker"), "repo");

    await createSessionWorktree(testProjectId, sessionId);

    expect(existsSync(path.join(wt, "node_modules"))).toBe(false);

    await removeSessionWorktree(testProjectId, sessionId);
  });

  it("strips an existing node_modules symlink on a reused worktree", async () => {
    const sessionId = `test-sess-nm-reuse-${Date.now()}`;
    const wt = sessionWorktreePath(testProjectId, sessionId);
    await mkdir(path.join(repoDir, "node_modules"), { recursive: true });
    await createSessionWorktree(testProjectId, sessionId);
    await symlink(
      path.join(repoDir, "node_modules"),
      path.join(wt, "node_modules"),
      "dir",
    );

    await createSessionWorktree(testProjectId, sessionId);

    const st = await lstat(path.join(wt, "node_modules")).catch(() => null);
    expect(st?.isSymbolicLink() ?? false).toBe(false);

    await removeSessionWorktree(testProjectId, sessionId);
  });

  it("changes in session worktree are isolated from the main repo", async () => {
    // Write a file in worktree
    await writeFile(
      path.join(worktreeDir, "session-only.txt"),
      "session content",
    );
    await $`git -C ${worktreeDir} add .`.quiet();
    await $`git -C ${worktreeDir} commit -m "agent: add session-only file"`.quiet();

    // Verify main repo does not have session-only.txt
    expect(existsSync(path.join(repoDir, "session-only.txt"))).toBe(false);
    expect(existsSync(path.join(worktreeDir, "session-only.txt"))).toBe(true);
  });

  it("removeSessionWorktree removes the worktree directory and branch", async () => {
    await removeSessionWorktree(testProjectId, testSessionId);
    expect(existsSync(worktreeDir)).toBe(false);

    const branchExists = await $`git -C ${repoDir} rev-parse --verify agent/${testSessionId}`
      .quiet()
      .then(() => true)
      .catch(() => false);
    expect(branchExists).toBe(false);
  });

  it("pruneWorktrees runs without error", async () => {
    await pruneWorktrees(testProjectId);
  });
});
