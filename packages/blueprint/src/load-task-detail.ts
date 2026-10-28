import { prisma } from "@repo/db";
import { buildTaskDetail, type TaskDetail } from "./build-task-detail";

export type { TaskDetail } from "./build-task-detail";

export async function loadTaskDetail(taskId: string): Promise<TaskDetail> {
  const row = await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
    select: {
      type: true,
      title: true,
      owns: true,
      reads: true,
      blueprint: {
        select: {
          requirements: true,
          sessionId: true,
          session: { select: { projectId: true } },
          entities: true,
          pages: true,
          features: true,
          design: true,
          dependencyManifest: true,
          specification: true,
        },
      },
    },
  });
  const assetRequests = await prisma.assetRequest.findMany({
    where: { sessionId: row.blueprint.sessionId },
    select: { slots: true },
  });
  return buildTaskDetail({
    projectId: row.blueprint.session.projectId,
    task: row,
    blueprint: row.blueprint,
    assetSlotLists: assetRequests.map((request) => request.slots),
  });
}
