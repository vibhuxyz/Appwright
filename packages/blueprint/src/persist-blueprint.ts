import {
  prisma,
  syncManifestToRegistry,
  type Capability,
  type Prisma,
  type RiskTier,
  type TaskType,
} from "@repo/db";
import { generateDependencyManifest, type Plan } from "@repo/planner";
import type { DependencyManifest, ProjectSpecification } from "@repo/contracts";
import { taskTypeToPrisma } from "./map-task-row";
import { assignTaskIds, newTaskId } from "./task-ids";

export interface PersistedBlueprint {
  blueprintId: string;
  blueprintVersion: number;
  tasks: { id: string; type: string; title: string; dependsOn: string[] }[];
  manifest?: DependencyManifest;
}

export async function persistBlueprint(
  sessionId: string,
  plan: Plan,
  options?: { manifest?: DependencyManifest; specification?: ProjectSpecification },
): Promise<PersistedBlueprint> {
  const { blueprint, tasks, graph } = plan;
  const tasksWithIds = assignTaskIds(tasks, graph.dependsOn, newTaskId);

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { projectId: true, project: { select: { templateId: true } } },
  });

  const manifest =
    options?.manifest ??
    (session
      ? generateDependencyManifest({
          projectId: session.projectId,
          blueprint: plan.blueprint,
          templateId: session.project.templateId,
        })
      : undefined);

  const latest = await prisma.blueprint.findFirst({
    where: { sessionId },
    orderBy: { blueprintVersion: "desc" },
    select: { blueprintVersion: true },
  });

  const row = await prisma.blueprint.create({
    data: {
      sessionId,
      blueprintVersion: (latest?.blueprintVersion ?? 0) + 1,
      intent: blueprint.intent as Prisma.InputJsonValue,
      stack: blueprint.stack as Prisma.InputJsonValue,
      entities: blueprint.entities as Prisma.InputJsonValue,
      pages: blueprint.pages as Prisma.InputJsonValue,
      features: blueprint.features as Prisma.InputJsonValue,
      theme: blueprint.theme as Prisma.InputJsonValue,
      design: blueprint.design as Prisma.InputJsonValue,
      layout: blueprint.layout as Prisma.InputJsonValue,
      responsive: blueprint.responsive as Prisma.InputJsonValue,
      projectType: blueprint.projectType ?? null,
      requirements: (blueprint.requirements ?? []) as Prisma.InputJsonValue,
      dependencyManifest: (manifest as Prisma.InputJsonValue) ?? undefined,
      specification: (options?.specification as Prisma.InputJsonValue) ?? undefined,
      tasks: {
        create: tasksWithIds.map(({ task, id, dependsOn }) => ({
          id,
          type: taskTypeToPrisma(task.type) as TaskType,
          title: task.title,
          dependsOn: dependsOn as Prisma.InputJsonValue,
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

  if (session?.projectId && manifest) {
    await syncManifestToRegistry(session.projectId, manifest);
  }

  return {
    blueprintId: row.id,
    blueprintVersion: row.blueprintVersion,
    tasks: row.tasks.map((task) => ({
      id: task.id,
      type: task.type,
      title: task.title,
      dependsOn: task.dependsOn as string[],
    })),
    manifest,
  };
}
