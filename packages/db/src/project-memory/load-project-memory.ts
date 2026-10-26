import type { ProjectMemoryRows } from "@repo/contracts";
import { prisma } from "../lib/prisma";
import {
  MEMORY_TOOL_NAMES,
  PENDING_STATUS,
  PROJECT_MEMORY_LIMITS,
  UNRESOLVED_QUESTION_STATUSES,
} from "./constants";

const NEWEST_FIRST = [{ createdAt: "desc" as const }, { id: "desc" as const }];

async function loadLatestBlueprint(projectId: string): Promise<ProjectMemoryRows["blueprint"]> {
  const blueprint = await prisma.blueprint.findFirst({
    where: { session: { projectId } },
    orderBy: NEWEST_FIRST,
    select: {
      id: true,
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
  });
  if (!blueprint) return undefined;
  const approvals = await prisma.message.count({
    where: { session: { projectId }, data: { path: ["blueprintId"], equals: blueprint.id } },
  });
  return {
    intent: blueprint.intent,
    pages: blueprint.pages,
    features: blueprint.features,
    requirements: blueprint.requirements,
    tasks: blueprint.tasks,
    isApproved: approvals > 0,
  };
}

export async function loadProjectMemoryRows(projectId: string): Promise<ProjectMemoryRows> {
  const inProject = { session: { projectId } };
  const [userRows, toolCallRows, blueprint, questions, pendingIntegrations, assistantRows] = await Promise.all([
    prisma.message.findMany({
      where: { ...inProject, role: "user", type: "text" },
      orderBy: NEWEST_FIRST,
      take: PROJECT_MEMORY_LIMITS.maxUserRows,
      select: { content: true, data: true, createdAt: true },
    }),
    prisma.message.findMany({
      where: {
        ...inProject,
        type: "toolCall",
        OR: MEMORY_TOOL_NAMES.map((toolName) => ({ data: { path: ["toolName"], equals: toolName } })),
      },
      orderBy: NEWEST_FIRST,
      take: PROJECT_MEMORY_LIMITS.maxToolCallRows,
      select: { type: true, data: true },
    }),
    loadLatestBlueprint(projectId),
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
      select: { data: true, createdAt: true },
    }),
  ]);
  return { userRows, toolCallRows, blueprint, questions, pendingIntegrations, assistantRows };
}
