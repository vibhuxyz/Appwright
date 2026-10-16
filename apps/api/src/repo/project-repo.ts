import { prisma, type Project } from "@repo/db";
import type { CreateProjectInput } from "./types";

export class ProjectRepository {
  constructor(private readonly userId: string) {}

  async list(): Promise<Project[]> {
    return prisma.project.findMany({
      where: { userId: this.userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string): Promise<Project | null> {
    return prisma.project.findFirst({
      where: { id, userId: this.userId },
    });
  }

  async create(input: CreateProjectInput): Promise<Project> {
    return prisma.project.create({
      data: {
        name: input.name,
        templateId: input.templateId ?? "vite-react",
        workspacePath: input.workspacePath,
        userId: this.userId,
      },
    });
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;

    await prisma.project.delete({
      where: { id },
    });
    return true;
  }
}
