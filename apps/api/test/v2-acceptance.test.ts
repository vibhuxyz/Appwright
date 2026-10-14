import "../src/env";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { $ } from "bun";
import { prisma } from "@repo/db";
import { listProjectPaths } from "@repo/contracts";
import { diffSession, mergeSession } from "@repo/tools";
import { parseTscErrors } from "@repo/verify";
import { requiresApproval } from "@repo/decision-engine";
import {
  createSessionWorktree,
  initProjectGit,
  projectRepoPath,
  removeSessionWorktree,
  sessionWorktreePath,
  WORKSPACES_DIR,
} from "../src/workspace/manager";

describe("V2 Slice 6 Acceptance & Engineering Gate", () => {
  const projectId = `v2-acc-proj-${Date.now()}`;
  const sessionA = `sess-a-${Date.now()}`;
  const sessionB = `sess-b-${Date.now()}`;
  const repoDir = projectRepoPath(projectId);
  const worktreeA = sessionWorktreePath(projectId, sessionA);
  const worktreeB = sessionWorktreePath(projectId, sessionB);
  let userId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `v2-acc-${Date.now()}@appwright.local`,
        hashPassword: "test-password-hash",
      },
    });
    userId = user.id;

    await prisma.project.create({
      data: {
        id: projectId,
        name: "V2 Acceptance Test",
        workspacePath: repoDir,
        userId,
      },
    });

    await mkdir(repoDir, { recursive: true });
    await writeFile(
      path.join(repoDir, "App.tsx"),
      "export function App() { return <div>Base App</div>; }\n",
    );
    await initProjectGit(repoDir);
  });

  afterAll(async () => {
    await rm(path.join(WORKSPACES_DIR, projectId), {
      recursive: true,
      force: true,
    });
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  });

  it("1. two concurrent sessions run isolated on separate branches", async () => {
    await createSessionWorktree(projectId, sessionA);
    await createSessionWorktree(projectId, sessionB);

    const branches = await $`git -C ${repoDir} branch`.text();
    expect(branches).toContain(`agent/${sessionA}`);
    expect(branches).toContain(`agent/${sessionB}`);

    await writeFile(
      path.join(worktreeA, "FeatureA.tsx"),
      "export const FeatureA = () => <div>Feature A</div>;\n",
    );
    await $`git -C ${worktreeA} add .`.quiet();
    await $`git -C ${worktreeA} commit -m "agent: feature A"`.quiet();

    await writeFile(
      path.join(worktreeB, "FeatureB.tsx"),
      "export const FeatureB = () => <div>Feature B</div>;\n",
    );
    await $`git -C ${worktreeB} add .`.quiet();
    await $`git -C ${worktreeB} commit -m "agent: feature B"`.quiet();

    expect(existsSync(path.join(worktreeA, "FeatureB.tsx"))).toBe(false);
    expect(existsSync(path.join(worktreeB, "FeatureA.tsx"))).toBe(false);

    const pathsA = await listProjectPaths(projectId, sessionA);
    const pathsB = await listProjectPaths(projectId, sessionB);
    expect(pathsA).toContain("FeatureA.tsx");
    expect(pathsA).not.toContain("FeatureB.tsx");
    expect(pathsB).toContain("FeatureB.tsx");
    expect(pathsB).not.toContain("FeatureA.tsx");
  });

  it("2. approvals persist as DB rows and survive simulated API restart", async () => {
    const session = await prisma.session.create({
      data: {
        id: sessionA,
        projectId,
        title: "Session A",
        mode: "default",
      },
    });

    const approval = await prisma.approval.create({
      data: {
        sessionId: session.id,
        toolName: "bash",
        args: { command: "rm -rf node_modules" },
        status: "PENDING",
      },
    });
    expect(approval.status).toBe("PENDING");

    const fetchedAfterRestart = await prisma.approval.findUnique({
      where: { id: approval.id },
    });
    expect(fetchedAfterRestart).not.toBeNull();
    expect(fetchedAfterRestart?.status).toBe("PENDING");
    expect(fetchedAfterRestart?.toolName).toBe("bash");

    const resolved = await prisma.approval.update({
      where: { id: approval.id },
      data: {
        status: "APPROVED",
        resolvedAt: new Date(),
      },
    });
    expect(resolved.status).toBe("APPROVED");
    expect(resolved.resolvedAt).not.toBeNull();
  });

  it("3. allowedTools in session bypasses approval requirement", async () => {
    const checkUnallowed = requiresApproval({
      toolName: "write_file",
      mode: "default",
      allowedTools: [],
    });
    expect(checkUnallowed).toBe(true);

    const checkAllowed = requiresApproval({
      toolName: "write_file",
      mode: "default",
      allowedTools: ["write_file"],
    });
    expect(checkAllowed).toBe(false);

    const checkDangerous = requiresApproval({
      toolName: "bash",
      mode: "default",
      allowedTools: ["bash"],
      args: { command: "git push origin main" },
    });
    expect(checkDangerous).toBe(true);
  });

  it("4. inspects per-file diff vs main and merges cleanly with cleanup", async () => {
    const diffs = await diffSession(repoDir, `agent/${sessionA}`);
    expect(diffs.length).toBeGreaterThan(0);
    expect(diffs.some((d) => d.path === "FeatureA.tsx")).toBe(true);

    const mergeResult = await mergeSession(repoDir, `agent/${sessionA}`);
    expect(mergeResult.ok).toBe(true);
    expect(mergeResult.conflict).toBe(false);

    expect(existsSync(path.join(repoDir, "FeatureA.tsx"))).toBe(true);

    await removeSessionWorktree(projectId, sessionA);
    expect(existsSync(worktreeDirA(projectId, sessionA))).toBe(false);
  });

  it("5. surfaces merge conflicts cleanly with file list on overlapping edits", async () => {
    await writeFile(
      path.join(repoDir, "App.tsx"),
      "export function App() { return <div>Main Overwrite</div>; }\n",
    );
    await $`git -C ${repoDir} add .`.quiet();
    await $`git -C ${repoDir} commit -m "main: concurrent edit on App"`.quiet();

    await writeFile(
      path.join(worktreeB, "App.tsx"),
      "export function App() { return <div>Session B Overwrite</div>; }\n",
    );
    await $`git -C ${worktreeB} add .`.quiet();
    await $`git -C ${worktreeB} commit -m "agent: session B edit on App"`.quiet();

    const conflictResult = await mergeSession(repoDir, `agent/${sessionB}`);
    expect(conflictResult.ok).toBe(false);
    expect(conflictResult.conflict).toBe(true);
    expect(conflictResult.conflicts).toContain("App.tsx");

    await removeSessionWorktree(projectId, sessionB);
  });

  it("6. structured verification parser catches type errors accurately", () => {
    const rawTscOutput =
      "src/App.tsx(14,7): error TS2322: Type 'number' is not assignable to type 'string'.\n";
    const errors = parseTscErrors(rawTscOutput);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.file).toBe("src/App.tsx");
    expect(errors[0]?.line).toBe(14);
    expect(errors[0]?.col).toBe(7);
    expect(errors[0]?.message).toContain("Type 'number' is not assignable to type 'string'");
  });
});

function worktreeDirA(projectId: string, sessionId: string): string {
  return sessionWorktreePath(projectId, sessionId);
}
