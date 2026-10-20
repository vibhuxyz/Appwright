import { prisma, type Capability, type Prisma, type RiskTier, type TaskType } from "@repo/db";
import type { Plan } from "@repo/planner";

export interface PersistedBlueprint {
  blueprintId: string;
  blueprintVersion: number;
  tasks: { id: string; type: string; title: string; dependsOn: string[] }[];
}

export async function persistBlueprint(sessionId: string, plan: Plan): Promise<PersistedBlueprint> {
  const { blueprint, tasks, graph } = plan;

  const row = await prisma.blueprint.create({
    data: {
      sessionId,
      blueprintVersion: blueprint.blueprintVersion,
      intent: blueprint.intent as Prisma.InputJsonValue,
      stack: blueprint.stack as Prisma.InputJsonValue,
      entities: blueprint.entities as Prisma.InputJsonValue,
      pages: blueprint.pages as Prisma.InputJsonValue,
      features: blueprint.features as Prisma.InputJsonValue,
      theme: blueprint.theme as Prisma.InputJsonValue,
      design: blueprint.design as Prisma.InputJsonValue,
      layout: blueprint.layout as Prisma.InputJsonValue,
      responsive: blueprint.responsive as Prisma.InputJsonValue,
      tasks: {
        create: tasks.map((task) => ({
          id: task.id,
          type: task.type.toUpperCase() as TaskType,
          title: task.title,
          dependsOn: (graph.dependsOn.get(task.id) ?? []) as Prisma.InputJsonValue,
          owns: task.owns as Prisma.InputJsonValue,
          reads: task.reads as Prisma.InputJsonValue,
          riskTier: task.riskTier.toUpperCase() as RiskTier,
          capability: task.capability.toUpperCase() as Capability,
          verification: task.verification as Prisma.InputJsonValue,
        })),
      },
    },
    include: { tasks: { select: { id: true, type: true, title: true, dependsOn: true } } },
  });

  return {
    blueprintId: row.id,
    blueprintVersion: row.blueprintVersion,
    tasks: row.tasks.map((task) => ({
      id: task.id,
      type: task.type,
      title: task.title,
      dependsOn: task.dependsOn as string[],
    })),
  };
}
