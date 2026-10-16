import { enqueueJob, prisma, type Job } from "@repo/db";
import { createSessionWorktree } from "../workspace/manager";
import { publishMessage } from "../stream/sse";
import { serializeRow } from "./message-mapper";

export interface EnqueueConversationOptions {
  sessionId: string;
  projectId: string;
  prompt: string;
}

// The flag-gated V3 path: persist + enqueue, then return. apps/agent (a
// separate process) claims the Job from Postgres and runs it inside a
// sandbox, publishing to the same session:<id> channel the synchronous
// V0-V2 path (runConversation) does — the browser's /stream connection
// can't tell which one produced an event.
export async function enqueueConversation(
  opts: EnqueueConversationOptions,
): Promise<Job> {
  const { sessionId, projectId, prompt } = opts;

  const lastMessage = await prisma.message.findFirst({
    where: { sessionId },
    orderBy: { seq: "desc" },
    select: { seq: true },
  });
  const seq = (lastMessage?.seq ?? -1) + 1;

  const userRow = await prisma.message.create({
    data: {
      sessionId,
      seq,
      role: "user",
      type: "text",
      content: prompt.replaceAll("\u0000", ""),
    },
  });
  publishMessage(sessionId, { kind: "message", seq, message: serializeRow(userRow) });

  await createSessionWorktree(projectId, sessionId);

  return enqueueJob({ sessionId, projectId });
}
