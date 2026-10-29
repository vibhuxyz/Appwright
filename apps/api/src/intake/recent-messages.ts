import { prisma } from "@repo/db";

const RECENT_MESSAGE_COUNT = 2;
const CONVERSATION_ROLES = ["user", "assistant"];

export async function recentMessageTexts(sessionId: string | undefined): Promise<string[]> {
  if (!sessionId) return [];
  const rows = await prisma.message.findMany({
    where: { sessionId, role: { in: CONVERSATION_ROLES }, type: "text" },
    orderBy: { seq: "desc" },
    take: RECENT_MESSAGE_COUNT,
    select: { content: true },
  });
  return rows.reverse().map((row) => row.content);
}
