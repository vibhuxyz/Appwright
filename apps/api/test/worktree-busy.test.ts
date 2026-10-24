import "../src/env";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { prisma } from "@repo/db";
import { sessionBranchName } from "@repo/workspace";
import { isWorktreeBusy } from "../src/workflow/run-limit";

describe("isWorktreeBusy", () => {
  const projectId = `worktree-busy-${Date.now()}`;
  let userId: string | null = null;
  let firstChatId = "";
  let newChatId = "";
  let otherWorktreeChatId = "";

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `${projectId}@appwright.local`,
        hashPassword: "test-hash",
      },
    });
    userId = user.id;
    await prisma.project.create({
      data: {
        id: projectId,
        name: "worktree-busy",
        workspacePath: projectId,
        userId: user.id,
      },
    });
    const firstChat = await prisma.session.create({ data: { projectId } });
    firstChatId = firstChat.id;
    const [newChat, otherWorktreeChat] = await Promise.all([
      prisma.session.create({
        data: { projectId, branch: sessionBranchName(firstChat.id) },
      }),
      prisma.session.create({ data: { projectId, status: "RUNNING" } }),
    ]);
    newChatId = newChat.id;
    otherWorktreeChatId = otherWorktreeChat.id;
  });

  afterAll(async () => {
    if (userId)
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  });

  it("is free when no chat on the worktree is running", async () => {
    expect(await isWorktreeBusy(firstChatId, newChatId)).toBe(false);
  });

  it("is busy for a new chat while the chat that owns the worktree runs", async () => {
    await prisma.session.update({
      where: { id: firstChatId },
      data: { status: "RUNNING" },
    });
    expect(await isWorktreeBusy(firstChatId, newChatId)).toBe(true);
  });

  it("is busy for the owning chat while a new chat on its worktree awaits approval", async () => {
    await prisma.session.update({
      where: { id: firstChatId },
      data: { status: "IDLE" },
    });
    await prisma.session.update({
      where: { id: newChatId },
      data: { status: "AWAITING_APPROVAL" },
    });
    expect(await isWorktreeBusy(firstChatId, firstChatId)).toBe(true);
  });

  it("ignores running chats on a different worktree", async () => {
    await prisma.session.update({
      where: { id: newChatId },
      data: { status: "IDLE" },
    });
    expect(await isWorktreeBusy(firstChatId, newChatId)).toBe(false);
    expect(await isWorktreeBusy(otherWorktreeChatId, otherWorktreeChatId)).toBe(
      false,
    );
  });
});
