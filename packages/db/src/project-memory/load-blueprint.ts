import type { ProjectMemoryRows } from "@repo/contracts";
import { prisma } from "../lib/prisma";
import { NEWEST_FIRST, PROJECT_MEMORY_LIMITS } from "./constants";
import { isCreatedInRevertedTurn, type SessionRevertedTurn } from "./reverted-turns";

export async function loadLatestLiveBlueprint(
  projectId: string,
  revertedTurns: readonly SessionRevertedTurn[],
): Promise<ProjectMemoryRows["blueprint"]> {
  const candidates = await prisma.blueprint.findMany({
    where: { session: { projectId } },
    orderBy: NEWEST_FIRST,
    take: PROJECT_MEMORY_LIMITS.maxBlueprintCandidates,
    select: { id: true, sessionId: true, createdAt: true },
  });
  const live = candidates.find((candidate) => !isCreatedInRevertedTurn(candidate, revertedTurns));
  if (!live) return undefined;
  const [blueprint, approvals] = await Promise.all([
    prisma.blueprint.findUniqueOrThrow({
      where: { id: live.id },
      select: {
        intent: true,
        pages: true,
        features: true,
        requirements: true,
        tasks: {
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          take: PROJECT_MEMORY_LIMITS.maxTasks,
          select: { title: true, status: true, owns: true },
        },
      },
    }),
    prisma.message.count({ where: { session: { projectId }, data: { path: ["blueprintId"], equals: live.id } } }),
  ]);
  return { ...blueprint, isApproved: approvals > 0 };
}
