import { prisma, type Prisma } from "@repo/db";

export async function attachVerification(
  sessionId: string,
  verification: readonly unknown[],
): Promise<void> {
  const lastAssistantText = await prisma.message.findFirst({
    where: { sessionId, role: "assistant", type: "text" },
    orderBy: { seq: "desc" },
    select: { id: true, data: true },
  });
  if (!lastAssistantText) return;
  const existing =
    lastAssistantText.data && typeof lastAssistantText.data === "object"
      ? (lastAssistantText.data as Record<string, unknown>)
      : {};
  await prisma.message.update({
    where: { id: lastAssistantText.id },
    data: {
      data: { ...existing, verification } as Prisma.InputJsonValue,
    },
  });
}
