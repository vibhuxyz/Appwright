import { prisma, type Session } from "@repo/db";
import type { CreateSessionInput } from "./types";

export class SessionRepository {
  constructor(private readonly userId: string) {}

  async list(projectId: string): Promise<Session[]> {
    return prisma.session.findMany({
      where: {
        projectId,
        project: { userId: this.userId },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(sessionId: string): Promise<Session | null> {
    return prisma.session.findFirst({
      where: {
        id: sessionId,
        project: { userId: this.userId },
      },
    });
  }

  async create(input: CreateSessionInput): Promise<Session> {
    const project = await prisma.project.findFirst({
      where: { id: input.projectId, userId: this.userId },
      select: { id: true },
    });
    if (!project) {
      throw new Error(`Project not found: ${input.projectId}`);
    }

    return prisma.session.create({
      data: {
        projectId: input.projectId,
        model: input.model ?? "gpt-5.4-mini",
        title: input.title,
      },
    });
  }

  async delete(sessionId: string): Promise<boolean> {
    const existing = await this.findById(sessionId);
    if (!existing) return false;

    await prisma.session.delete({
      where: { id: sessionId },
    });
    return true;
  }
}
