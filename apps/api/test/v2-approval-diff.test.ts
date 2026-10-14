import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { $ } from "bun";
import {
  createSessionWorktree,
  initProjectGit,
  projectRepoPath,
  sessionWorktreePath,
  WORKSPACES_DIR,
} from "../src/workspace/manager";
import { diffSession, mergeSession, revertSession } from "@repo/tools";

describe("V2 Isolation & Control Integration (Slices 1, 2, 3)", () => {
  const testProjectId = `test-v2-proj-${Date.now()}`;
  const testSessionId = `test-v2-sess-${Date.now()}`;
  const repoDir = projectRepoPath(testProjectId);
  const worktreeDir = sessionWorktreePath(testProjectId, testSessionId);
  const branchName = `agent/${testSessionId}`;

  beforeAll(async () => {
    await mkdir(repoDir, { recursive: true });
    await writeFile(
      path.join(repoDir, "App.tsx"),
      "export function App() { return <div>Original</div>; }\n",
    );
    await initProjectGit(repoDir);
  });

  afterAll(async () => {
    await rm(path.join(WORKSPACES_DIR, testProjectId), {
      recursive: true,
      force: true,
    });
  });

  it("creates session worktree and isolates edits from main", async () => {
    await createSessionWorktree(testProjectId, testSessionId);
    expect(existsSync(worktreeDir)).toBe(true);

    await writeFile(
      path.join(worktreeDir, "App.tsx"),
      "export function App() { return <div>Updated in Session</div>; }\n",
    );
    await $`git -C ${worktreeDir} add .`.quiet();
    await $`git -C ${worktreeDir} commit -m "agent: update App"`.quiet();

    const diffs = await diffSession(repoDir, branchName);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]?.path).toBe("App.tsx");
    expect(diffs[0]?.status).toBe("modified");
    expect(diffs[0]?.additions).toBeGreaterThan(0);
  });

  it("merges cleanly into main", async () => {
    const result = await mergeSession(repoDir, branchName);
    expect(result.ok).toBe(true);
    expect(result.conflict).toBe(false);

    const mergedContent = await Bun.file(path.join(repoDir, "App.tsx")).text();
    expect(mergedContent).toContain("Updated in Session");
  });

  it("detects merge conflicts when concurrent sessions touch the same lines", async () => {
    const sessionB = `sess-b-${Date.now()}`;
    const worktreeB = sessionWorktreePath(testProjectId, sessionB);
    const branchB = `agent/${sessionB}`;

    await createSessionWorktree(testProjectId, sessionB);
    await writeFile(
      path.join(worktreeB, "App.tsx"),
      "export function App() { return <div>Conflict Version</div>; }\n",
    );
    await $`git -C ${worktreeB} add .`.quiet();
    await $`git -C ${worktreeB} commit -m "agent: conflict edit"`.quiet();

    await writeFile(
      path.join(repoDir, "App.tsx"),
      "export function App() { return <div>Main Changed First</div>; }\n",
    );
    await $`git -C ${repoDir} add .`.quiet();
    await $`git -C ${repoDir} commit -m "main: concurrent edit"`.quiet();

    const result = await mergeSession(repoDir, branchB);
    expect(result.ok).toBe(false);
    expect(result.conflict).toBe(true);
    expect(result.message).toContain("App.tsx");
  });
});
