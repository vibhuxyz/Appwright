import "../src/env";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { listProjectPaths, readProjectFile } from "@repo/contracts/files";
import { prisma } from "@repo/db";
import { hydrateSessionFilesFromToolCalls } from "../src/workspace/hydrate-session-files";
import { sessionWorktreePath, WORKSPACES_DIR } from "../src/workspace/manager";

describe("hydrateSessionFilesFromToolCalls", () => {
  const projectId = `hydrate-${Date.now()}`;
  const worktreeDir = path.join(WORKSPACES_DIR, projectId);
  let userId: string | null = null;
  let sessionId: string | null = null;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `${projectId}@appwright.local`,
        hashPassword: "test-hash",
      },
    });
    userId = user.id;

    const project = await prisma.project.create({
      data: {
        id: projectId,
        name: "hydrate",
        workspacePath: projectId,
        userId: user.id,
      },
    });

    const session = await prisma.session.create({
      data: { projectId: project.id },
    });
    sessionId = session.id;

    await mkdir(sessionWorktreePath(projectId, session.id), { recursive: true });

    await prisma.message.createMany({
      data: [
        {
          sessionId: session.id,
          seq: 0,
          role: "assistant",
          type: "toolCall",
          content: "write_file",
          data: {
            toolName: "write_file",
            args: {
              path: "src/components/BakeryHero.tsx",
              content: "export function BakeryHero() { return null; }\n",
            },
          },
        },
        {
          sessionId: session.id,
          seq: 1,
          role: "assistant",
          type: "toolCall",
          content: "edit_file",
          data: {
            toolName: "edit_file",
            args: {
              path: "src/components/BakeryHero.tsx",
              oldString: "return null;",
              newString: "return <h1>Hello</h1>;",
            },
          },
        },
        {
          sessionId: session.id,
          seq: 2,
          role: "assistant",
          type: "toolCall",
          content: "write_file",
          data: {
            toolName: "write_file",
            args: {
              path: "src/components/ui/button.tsx",
              content: "export function Button() {}",
            },
          },
        },
      ],
    });
  });

  afterAll(async () => {
    if (userId) await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await rm(worktreeDir, { recursive: true, force: true });
  });

  it("writes replayed toolCall files onto the session worktree", async () => {
    expect(sessionId).toBeTruthy();
    const written = await hydrateSessionFilesFromToolCalls(projectId, sessionId!);
    expect(written).toBe(1);

    const paths = await listProjectPaths(projectId, sessionId!);
    expect(paths).toContain("src/components/BakeryHero.tsx");
    expect(paths).not.toContain("src/components/ui/button.tsx");

    const content = await readProjectFile(
      projectId,
      "src/components/BakeryHero.tsx",
      sessionId!,
    );
    expect(content).toContain("return <h1>Hello</h1>;");

    const again = await hydrateSessionFilesFromToolCalls(projectId, sessionId!);
    expect(again).toBe(0);
  });
});
