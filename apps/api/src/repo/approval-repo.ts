import { prisma, type Approval } from "@repo/db";

export class ApprovalRepository {
  constructor(private readonly userId: string) {}

  async list(sessionId: string): Promise<Approval[]> {
    return prisma.approval.findMany({
      where: {
        sessionId,
        session: { project: { userId: this.userId } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async findById(approvalId: string): Promise<Approval | null> {
    return prisma.approval.findFirst({
      where: {
        id: approvalId,
        session: { project: { userId: this.userId } },
      },
    });
  }

  async resolve(
    approvalId: string,
    status: "APPROVED" | "DENIED",
    alwaysAllowTool?: boolean,
  ): Promise<Approval | null> {
    const existing = await this.findById(approvalId);
    if (!existing) return null;

    const updated = await prisma.approval.update({
      where: { id: approvalId },
      data: {
        status,
        resolvedAt: new Date(),
      },
    });

    if (status === "APPROVED" && alwaysAllowTool) {
      const session = await prisma.session.findUnique({
        where: { id: existing.sessionId },
        select: { allowedTools: true },
      });
      if (session && !session.allowedTools.includes(existing.toolName)) {
        await prisma.session.update({
          where: { id: existing.sessionId },
          data: {
            allowedTools: [...session.allowedTools, existing.toolName],
          },
        });
      }
    }

    return updated;
  }
}
