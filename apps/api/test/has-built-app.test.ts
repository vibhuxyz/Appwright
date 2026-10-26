import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { prisma } from "@repo/db";
import { projectHasBuiltApp } from "../src/intake";

let userId = "";

async function projectWithSession(name: string): Promise<{ projectId: string; sessionId: string }> {
  const project = await prisma.project.create({ data: { name, workspacePath: `/tmp/${name}`, userId } });
  const session = await prisma.session.create({ data: { projectId: project.id } });
  return { projectId: project.id, sessionId: session.id };
}

beforeAll(async () => {
  const user = await prisma.user.create({ data: { email: `built-app-${Date.now()}@example.com`, hashPassword: "x" } });
  userId = user.id;
});

afterAll(async () => {
  await prisma.user.delete({ where: { id: userId } });
});

describe("projectHasBuiltApp", () => {
  it("ignores tool calls and plan previews that never reached main", async () => {
    const { projectId, sessionId } = await projectWithSession("built-app-unmerged");
    await prisma.message.create({
      data: { sessionId, seq: 0, role: "assistant", type: "toolCall", content: "read_file", data: { toolCallId: "t1", toolName: "read_file", args: {} } },
    });
    await prisma.blueprint.create({
      data: { sessionId, blueprintVersion: 1, intent: {}, stack: {}, entities: [], pages: [], features: [], theme: {} },
    });
    expect(await projectHasBuiltApp(projectId)).toBe(false);
  });

  it("counts a run that was verified and merged to main", async () => {
    const { projectId, sessionId } = await projectWithSession("built-app-merged");
    await prisma.message.create({
      data: { sessionId, seq: 0, role: "assistant", type: "text", content: "merged", data: { merge: { merged: true } } },
    });
    expect(await projectHasBuiltApp(projectId)).toBe(true);
  });

  it("counts a completed blueprint run", async () => {
    const { projectId, sessionId } = await projectWithSession("built-app-run");
    await prisma.run.create({ data: { sessionId, blueprintVersion: 1, trigger: "INITIAL", status: "COMPLETED", budgetUsd: 1 } });
    expect(await projectHasBuiltApp(projectId)).toBe(true);
  });
});
