import { prisma } from "@repo/db";

export interface TaskDetail {
  type: string;
  title: string;
  owns: string[];
  reads: string[];
}

export async function loadTaskDetail(taskId: string): Promise<TaskDetail> {
  const row = await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
    select: { type: true, title: true, owns: true, reads: true },
  });
  return {
    type: row.type,
    title: row.title,
    owns: row.owns as string[],
    reads: row.reads as string[],
  };
}
