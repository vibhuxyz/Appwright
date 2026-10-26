import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { $ } from "bun";
import { formatProjectMemory } from "@repo/agent-core";
import { loadProjectMemoryRows, prisma } from "@repo/db";
import { commitTurn, mergeSession } from "@repo/tools";
import { sessionBranchName } from "@repo/workspace";
import { revertLastTurn } from "../src/revert-turn";
import {
  createSessionWorktree,
  initProjectGit,
  projectRepoPath,
  sessionWorktreePath,
  WORKSPACES_DIR,
} from "../src/workspace/manager";

async function addTurn(input: { sessionId: string; worktreeDir: string; seq: number; prompt: string; file: string }) {
  await writeFile(path.join(input.worktreeDir, input.file), `export const page = "${input.file}";\n`);
  const commit = await commitTurn(input.worktreeDir, input.prompt);
  if (commit.kind !== "committed") throw new Error(`expected a commit for ${input.file}`);
  await prisma.message.createMany({
    data: [
      { sessionId: input.sessionId, seq: input.seq, role: "user", type: "text", content: input.prompt, data: {} },
      {
        sessionId: input.sessionId,
        seq: input.seq + 1,
        role: "assistant",
        type: "text",
        content: `Built ${input.file}`,
        data: { checkpoint: { sha: commit.sha, isTurnCommit: true } },
      },
    ],
  });
  return commit.sha;
}

describe("revert the last agent turn", () => {
  let userId = "";
  let projectId = "";
  let sessionId = "";
  let repoDir = "";
  let worktreeDir = "";
  let firstSha = "";

  beforeAll(async () => {
    const user = await prisma.user.create({ data: { email: `revert-${Date.now()}@example.com`, hashPassword: "x" } });
    userId = user.id;
    const project = await prisma.project.create({ data: { name: "Revert", workspacePath: "/tmp/revert", userId } });
    projectId = project.id;
    const session = await prisma.session.create({ data: { projectId } });
    sessionId = session.id;
    repoDir = projectRepoPath(projectId);
    await $`mkdir -p ${repoDir}`.quiet();
    await writeFile(path.join(repoDir, "README.md"), "template\n");
    await initProjectGit(repoDir);
    await createSessionWorktree(projectId, sessionId);
    worktreeDir = sessionWorktreePath(projectId, sessionId);
    await writeFile(path.join(worktreeDir, ".env.local"), "SECRET=do-not-commit\n");
    firstSha = await addTurn({ sessionId, worktreeDir, seq: 0, prompt: "Build the home page", file: "home.tsx" });
    await mergeSession(repoDir, sessionBranchName(sessionId));
    await addTurn({ sessionId, worktreeDir, seq: 2, prompt: "Add a student dashboard", file: "dashboard.tsx" });
    await mergeSession(repoDir, sessionBranchName(sessionId));
  });

  afterAll(async () => {
    await rm(path.join(WORKSPACES_DIR, projectId), { recursive: true, force: true });
    await prisma.user.delete({ where: { id: userId } });
  });

  it("never commits env files", async () => {
    const files = await $`git -C ${worktreeDir} show --name-only --format= ${firstSha}`.quiet().text();
    expect(files).toContain("home.tsx");
    expect(files).not.toContain(".env.local");
  });

  it("refuses while the chat has uncommitted changes, and deletes nothing", async () => {
    await writeFile(path.join(worktreeDir, "draft.tsx"), "unsaved\n");
    const result = await revertLastTurn(projectId, sessionId);
    expect(result).toMatchObject({ ok: false, status: 409, code: "DIRTY" });
    expect(existsSync(path.join(worktreeDir, "draft.tsx"))).toBe(true);
    expect(existsSync(path.join(worktreeDir, "dashboard.tsx"))).toBe(true);
    await rm(path.join(worktreeDir, "draft.tsx"));
  });

  it("undoes exactly the last turn in the chat and on main, and records it", async () => {
    const result = await revertLastTurn(projectId, sessionId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.revertedTurn).toMatchObject({ fromSeq: 2, toSeq: 3, mainUpdated: true });
    expect(existsSync(path.join(worktreeDir, "dashboard.tsx"))).toBe(false);
    expect(existsSync(path.join(worktreeDir, "home.tsx"))).toBe(true);
    expect(existsSync(path.join(repoDir, "dashboard.tsx"))).toBe(false);
    expect(existsSync(path.join(repoDir, "home.tsx"))).toBe(true);
    const marker = await prisma.message.findFirst({ where: { sessionId, data: { path: ["revertMarker"], equals: true } } });
    expect(marker?.content).toContain('Undid the turn "Add a student dashboard"');
  });

  it("project memory shows the reverted request as reverted, not as built", async () => {
    const memory = formatProjectMemory(await loadProjectMemoryRows(projectId));
    expect(memory).toContain('## Reverted by the user (this work was undone; do not redo it unless the user asks again)\n- "Add a student dashboard"');
    expect(memory).toContain('"Build the home page"');
    const confirmed = memory.split("## Confirmed by the user")[1]?.split("\n## ")[0] ?? "";
    expect(confirmed).toContain('"Build the home page"');
    expect(confirmed).not.toContain("Add a student dashboard");
  });

  it("a second revert undoes the turn before it, not the same one again", async () => {
    const result = await revertLastTurn(projectId, sessionId);
    expect(result.ok && result.revertedTurn.sha).toBe(firstSha);
    expect(existsSync(path.join(worktreeDir, "home.tsx"))).toBe(false);
  });

  it("says there is nothing to undo once every saved turn is reverted", async () => {
    expect(await revertLastTurn(projectId, sessionId)).toMatchObject({ ok: false, code: "NOTHING_TO_REVERT" });
  });
});
