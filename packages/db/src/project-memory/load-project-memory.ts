import type { ProjectMemoryRows } from "@repo/contracts";
import { prisma } from "../lib/prisma";
import {
  MEMORY_TOOL_NAMES,
  NEWEST_FIRST,
  PENDING_STATUS,
  PROJECT_MEMORY_LIMITS,
  UNRESOLVED_QUESTION_STATUSES,
} from "./constants";
import { loadLatestLiveBlueprint } from "./load-blueprint";
import { parseRevertedTurns, toTurnRanges } from "./reverted-turns";

async function loadRevertedTurns(projectId: string) {
  const markers = await prisma.message.findMany({
    where: { session: { projectId }, data: { path: ["revertMarker"], equals: true } },
    orderBy: NEWEST_FIRST,
    take: PROJECT_MEMORY_LIMITS.maxRevertMarkers,
    select: { sessionId: true, data: true },
  });
  return parseRevertedTurns(markers);
}

export async function loadProjectMemoryRows(projectId: string): Promise<ProjectMemoryRows> {
  const inProject = { session: { projectId } };
  const revertedTurns = await loadRevertedTurns(projectId);
  const [userRows, toolCallRows, blueprint, questions, pendingIntegrations, assistantRows] = await Promise.all([
    prisma.message.findMany({
      where: { ...inProject, role: "user", type: "text" },
      orderBy: NEWEST_FIRST,
      take: PROJECT_MEMORY_LIMITS.maxUserRows,
      select: { sessionId: true, seq: true, content: true, data: true, createdAt: true },
    }),
    prisma.message.findMany({
      where: {
        ...inProject,
        type: "toolCall",
        OR: MEMORY_TOOL_NAMES.map((toolName) => ({ data: { path: ["toolName"], equals: toolName } })),
      },
      orderBy: NEWEST_FIRST,
      take: PROJECT_MEMORY_LIMITS.maxToolCallRows,
      select: { sessionId: true, seq: true, type: true, data: true },
    }),
    loadLatestLiveBlueprint(projectId, revertedTurns),
    prisma.agentQuestion.findMany({
      where: { ...inProject, status: { in: [...UNRESOLVED_QUESTION_STATUSES] } },
      orderBy: NEWEST_FIRST,
      take: PROJECT_MEMORY_LIMITS.maxOpenQuestionRows,
      select: { status: true, questions: true },
    }),
    prisma.integrationRequest.findMany({
      where: { projectId, status: PENDING_STATUS },
      orderBy: NEWEST_FIRST,
      take: PROJECT_MEMORY_LIMITS.maxIntegrationRequestRows,
      select: { provider: true, reason: true },
    }),
    prisma.message.findMany({
      where: { ...inProject, role: "assistant", type: "text" },
      orderBy: NEWEST_FIRST,
      take: PROJECT_MEMORY_LIMITS.maxRecentAssistantRows,
      select: { sessionId: true, seq: true, content: true, data: true, createdAt: true },
    }),
  ]);
  return {
    userRows,
    toolCallRows,
    blueprint,
    questions,
    pendingIntegrations,
    assistantRows,
    revertedTurns: toTurnRanges(revertedTurns),
  };
}
