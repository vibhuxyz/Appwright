import { prisma } from "@repo/db";
import { publishMessage } from "../stream/sse";
import { serializeRow } from "../workflow/message-mapper";

interface ChatTurn {
  sessionId: string;
  prompt: string;
  reply: string;
}

export async function persistChatTurn({ sessionId, prompt, reply }: ChatTurn): Promise<void> {
  const last = await prisma.message.findFirst({
    where: { sessionId },
    orderBy: { seq: "desc" },
    select: { seq: true },
  });
  const firstSeq = (last?.seq ?? -1) + 1;
  const turns = [
    { role: "user", content: prompt },
    { role: "assistant", content: reply },
  ] as const;
  for (const [offset, turn] of turns.entries()) {
    const row = await prisma.message.create({
      data: {
        sessionId,
        seq: firstSeq + offset,
        role: turn.role,
        type: "text",
        content: turn.content.replaceAll("\u0000", ""),
      },
    });
    publishMessage(sessionId, { kind: "message", seq: row.seq, message: serializeRow(row) });
  }
}
