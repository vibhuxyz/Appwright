import type { AgentQuestionAnswer, AgentQuestionItem, AgentQuestionResponse } from "@repo/contracts";
import type { Prisma } from "../../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { toAgentQuestionResponse } from "./serialize";
import type { AgentQuestionOutcome, ResolveAgentQuestionResult, SkippedAgentQuestion } from "./types";

const PENDING = "PENDING";
const MAX_PENDING_QUESTIONS = 10;

const ROW_SELECT = {
  id: true,
  sessionId: true,
  toolCallId: true,
  status: true,
  questions: true,
  answers: true,
  createdAt: true,
  expiresAt: true,
} as const;

export async function createAgentQuestion(input: {
  sessionId: string;
  toolCallId: string | null;
  questions: readonly AgentQuestionItem[];
  expiresAt: Date;
}): Promise<{ id: string }> {
  return prisma.agentQuestion.create({
    data: {
      sessionId: input.sessionId,
      toolCallId: input.toolCallId,
      questions: input.questions as unknown as Prisma.InputJsonArray,
      expiresAt: input.expiresAt,
    },
    select: { id: true },
  });
}

export async function listPendingAgentQuestions(
  sessionId: string,
  now: Date,
): Promise<{ items: AgentQuestionResponse[]; skipped: SkippedAgentQuestion[] }> {
  const rows = await prisma.agentQuestion.findMany({
    where: { sessionId, status: PENDING, expiresAt: { gt: now } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: MAX_PENDING_QUESTIONS,
    select: ROW_SELECT,
  });
  const items: AgentQuestionResponse[] = [];
  const skipped: SkippedAgentQuestion[] = [];
  for (const row of rows) {
    const response = toAgentQuestionResponse(row);
    if (response) items.push(response);
    else skipped.push({ id: row.id, reason: "Stored questions failed validation" });
  }
  return { items, skipped };
}

export async function getAgentQuestion(id: string): Promise<AgentQuestionResponse | null> {
  const row = await prisma.agentQuestion.findUnique({ where: { id }, select: ROW_SELECT });
  return row ? toAgentQuestionResponse(row) : null;
}

async function resolvePending(id: string, data: Prisma.AgentQuestionUpdateManyMutationInput): Promise<ResolveAgentQuestionResult> {
  const updated = await prisma.agentQuestion.updateMany({ where: { id, status: PENDING }, data });
  return updated.count === 1 ? { ok: true } : { ok: false, reason: "ALREADY_RESOLVED" };
}

export function answerAgentQuestion(input: {
  id: string;
  answers: readonly AgentQuestionAnswer[];
  now: Date;
}): Promise<ResolveAgentQuestionResult> {
  return resolvePending(input.id, {
    status: "ANSWERED",
    answers: input.answers as unknown as Prisma.InputJsonArray,
    resolvedAt: input.now,
  });
}

export function dismissAgentQuestion(input: { id: string; now: Date }): Promise<ResolveAgentQuestionResult> {
  return resolvePending(input.id, { status: "DISMISSED", resolvedAt: input.now });
}

export function expireAgentQuestion(input: { id: string; now: Date }): Promise<ResolveAgentQuestionResult> {
  return resolvePending(input.id, { status: "EXPIRED", resolvedAt: input.now });
}

export async function getAgentQuestionOutcome(id: string): Promise<AgentQuestionOutcome | null> {
  const question = await getAgentQuestion(id);
  if (!question) return { status: "EXPIRED", answers: null };
  if (question.status === PENDING) return null;
  return { status: question.status, answers: question.answers };
}
