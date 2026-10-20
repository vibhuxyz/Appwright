import "../src/env";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { $ } from "bun";
import { prisma } from "@repo/db";
import { detectConflicts, mergeSession, resolveConflicts } from "@repo/tools";
import { waitForApproval } from "../src/workflow/approval-gate";
import {
  createSessionWorktree,
  initProjectGit,
  projectRepoPath,
  sessionWorktreePath,
  WORKSPACES_DIR,
} from "../src/workspace/manager";

const stamp = Date.now();
const projectId = `v2-s6-proj-${stamp}`;
const sessionA = `s6-a-${stamp}`;
const sessionB = `s6-b-${stamp}`;
const repoDir = projectRepoPath(projectId);
const SHARED_FILE = "App.tsx";
const PENDING_WAIT_MS = 5_000;
const POLL_INTERVAL_MS = 50;

async function commitIn(dir: string, message: string): Promise<void> {
  await $`git -C ${dir} add -A`.quiet();
  await $`git -C ${dir} commit -m ${message}`.quiet();
}

async function waitForPendingRow(sessionId: string): Promise<{ id: string }> {
  const deadline = Date.now() + PENDING_WAIT_MS;
  while (Date.now() < deadline) {
    const row = await prisma.approval.findFirst({
      where: { sessionId, status: "PENDING" },
    });
    if (row) return row;
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  throw new Error(`No pending approval appeared for session ${sessionId}`);
}

describe("V2 Slice 6 proof", () => {
  let userId = "";

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { email: `v2-s6-${stamp}@appwright.local`, hashPassword: "x" },
    });
    userId = user.id;
    await prisma.project.create({
      data: { id: projectId, name: "S6", workspacePath: repoDir, userId },
    });
    await mkdir(repoDir, { recursive: true });
    await writeFile(
      path.join(repoDir, SHARED_FILE),
      "export const App = 'base';\n",
    );
    await initProjectGit(repoDir);
    await Promise.all(
      [sessionA, sessionB].map((id) =>
        prisma.session.create({
          data: { id, projectId, title: id, mode: "default" },
        }),
      ),
    );
  });

  afterAll(async () => {
    await rm(path.join(WORKSPACES_DIR, projectId), {
      recursive: true,
      force: true,
    });
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  });

  it("keeps a pending approval resolvable after the parked loop dies", async () => {
    const oldProcess = new AbortController();
    const parked = waitForApproval({
      sessionId: sessionA,
      toolCallId: "call-1",
      toolName: "bash",
      args: { command: "rm -rf node_modules" },
      mode: "default",
      signal: oldProcess.signal,
    });
    const pending = await waitForPendingRow(sessionA);
    oldProcess.abort();
    expect((await parked).approved).toBe(false);

    const afterRestart = await prisma.approval.findUnique({
      where: { id: pending.id },
    });
    expect(afterRestart?.status).toBe("PENDING");
    expect(afterRestart?.args).toEqual({ command: "rm -rf node_modules" });
    const session = await prisma.session.findUnique({
      where: { id: sessionA },
    });
    expect(session?.status).toBe("AWAITING_APPROVAL");

    const resolved = await prisma.approval.update({
      where: { id: pending.id },
      data: { status: "APPROVED", resolvedAt: new Date() },
    });
    expect(resolved.status).toBe("APPROVED");
  });

  it("surfaces a same-file conflict on the second merge and resolves by choice", async () => {
    const [worktreeA, worktreeB] = await Promise.all([
      createSessionWorktree(projectId, sessionA),
      createSessionWorktree(projectId, sessionB),
    ]);
    expect(worktreeA).toBe(sessionWorktreePath(projectId, sessionA));
    await writeFile(
      path.join(worktreeA, SHARED_FILE),
      "export const App = 'from A';\n",
    );
    await writeFile(
      path.join(worktreeB, SHARED_FILE),
      "export const App = 'from B';\n",
    );
    await commitIn(worktreeA, "agent: A edits App");
    await commitIn(worktreeB, "agent: B edits App");

    const first = await mergeSession(repoDir, `agent/${sessionA}`);
    expect(first.ok).toBe(true);

    const second = await mergeSession(repoDir, `agent/${sessionB}`);
    expect(second).toMatchObject({
      ok: false,
      conflict: true,
      conflicts: [SHARED_FILE],
    });
    expect(await readFile(path.join(repoDir, SHARED_FILE), "utf8")).toBe(
      "export const App = 'from A';\n",
    );

    const report = await detectConflicts(repoDir, `agent/${sessionB}`);
    expect(report.hasConflict && report.files[0]?.session).toBe(
      "export const App = 'from B';\n",
    );

    const resolved = await resolveConflicts(repoDir, `agent/${sessionB}`, [
      { path: SHARED_FILE, side: "session" },
    ]);
    expect(resolved.ok).toBe(true);
    expect(await readFile(path.join(repoDir, SHARED_FILE), "utf8")).toBe(
      "export const App = 'from B';\n",
    );
  });
});
