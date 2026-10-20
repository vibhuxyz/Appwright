import { afterAll, describe, expect, it } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { FakeProvider } from "@repo/agent-core";
import { enqueueJob, prisma } from "@repo/db";
import { LocalSandboxProvider } from "@repo/sandbox";
import { sessionWorktreePath, WORKSPACES_DIR } from "@repo/workspace";
import { $ } from "bun";
import { executeAgentJob } from "../src/worker";

describe("apps/agent - V3 sandboxed job execution", () => {
  const testId = `agent-test-${Date.now()}`;
  const projectId = `proj-${testId}`;
  let userId: string | null = null;
  let worktreeDir: string | null = null;

  afterAll(async () => {
    if (userId) await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    if (worktreeDir) rmSync(worktreeDir, { recursive: true, force: true });
    rmSync(`${WORKSPACES_DIR}/${projectId}`, { recursive: true, force: true });
  });

  it("runs the agent loop inside a real sandbox and persists + checkpoints the result", async () => {
    const user = await prisma.user.create({
      data: {
        email: `${testId}@example.com`,
        hashPassword: "test-hash",
        credits: 100_000,
      },
    });
    userId = user.id;

    const project = await prisma.project.create({
      data: { id: projectId, name: testId, workspacePath: projectId, userId: user.id },
    });

    const session = await prisma.session.create({
      data: { projectId: project.id },
    });

    worktreeDir = sessionWorktreePath(projectId, session.id);
    mkdirSync(worktreeDir, { recursive: true });
    await $`git -C ${worktreeDir} init -q`;
    await $`git -C ${worktreeDir} config user.email test@example.com`;
    await $`git -C ${worktreeDir} config user.name test`;
    await Bun.write(`${worktreeDir}/README.md`, "# fixture\n");
    await $`git -C ${worktreeDir} add .`.quiet();
    await $`git -C ${worktreeDir} commit -q -m initial`;

    await prisma.message.create({
      data: {
        sessionId: session.id,
        seq: 0,
        role: "user",
        type: "text",
        content: "Say hello.",
      },
    });

    const job = await enqueueJob({ sessionId: session.id, projectId: project.id });

    const sandboxProvider = new LocalSandboxProvider();
    const fakeProvider = new FakeProvider([
      {
        kind: "text",
        text: JSON.stringify({
          intent: "modify",
          changeType: "text",
          risk: "low",
          route: "none",
          component: "none",
          complexity: 1,
          ambiguity: 1,
          confidence: 0.9,
        }),
      },
      {
        kind: "toolCall",
        toolCallId: "call-1",
        toolName: "write_file",
        args: { path: "hello.txt", content: "hi from the sandbox\n" },
      },
      { kind: "text", text: "Hello from the sandbox." },
    ]);

    try {
      const result = await executeAgentJob(
        job,
        sandboxProvider,
        async () => {},
        fakeProvider,
      );

      expect(result.jobId).toBe(job.id);
      expect(result.sessionId).toBe(session.id);
      expect(result.stopReason).toBe("completed");

      const messages = await prisma.message.findMany({
        where: { sessionId: session.id },
        orderBy: { seq: "asc" },
      });
      const assistantReply = messages.find(
        (m) => m.role === "assistant" && m.type === "text",
      );
      expect(assistantReply?.content).toBe("Hello from the sandbox.");

      const updatedSession = await prisma.session.findUnique({ where: { id: session.id } });
      expect(updatedSession?.status).toBe("IDLE");

      const log = await $`git -C ${worktreeDir} log -1 --pretty=%B`.text();
      expect(log.trim().startsWith("agent:")).toBe(true);
    } finally {
      await sandboxProvider.destroyAll();
    }
  });
});
