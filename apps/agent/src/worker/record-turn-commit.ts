import type { TurnCheckpoint } from "@repo/contracts";
import { prisma, type Prisma } from "@repo/db";
import { commitTurn, type CommitTurnResult } from "@repo/tools";

async function attachCheckpoint(sessionId: string, checkpoint: TurnCheckpoint): Promise<boolean> {
  const lastAssistantText = await prisma.message.findFirst({
    where: { sessionId, role: "assistant", type: "text" },
    orderBy: { seq: "desc" },
    select: { id: true, data: true },
  });
  if (!lastAssistantText) return false;
  const existing =
    lastAssistantText.data && typeof lastAssistantText.data === "object"
      ? (lastAssistantText.data as Record<string, unknown>)
      : {};
  await prisma.message.update({
    where: { id: lastAssistantText.id },
    data: { data: { ...existing, checkpoint: checkpoint } as Prisma.InputJsonValue },
  });
  return true;
}

export async function recordTurnCommit(input: {
  sessionId: string;
  worktreeDir: string;
  prompt: string;
}): Promise<CommitTurnResult & { attached?: boolean }> {
  const result = await commitTurn(input.worktreeDir, input.prompt);
  if (result.kind !== "committed") return result;
  const attached = await attachCheckpoint(input.sessionId, { sha: result.sha, isTurnCommit: true });
  return { ...result, attached };
}
