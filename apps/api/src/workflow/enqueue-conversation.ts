import type { Attachment, ElementSelection, ThemeOption } from "@repo/contracts";
import { enqueueJob, prisma, type Job, type Prisma } from "@repo/db";
import {
  requirementTurns,
  themeTurn,
  type IntakeQuestion,
  type PromptAnswer,
} from "@repo/planner";
import { createSessionWorktree } from "../workspace/manager";
import { publishMessage } from "../stream/sse";
import { serializeRow } from "./message-mapper";

export interface EnqueueConversationOptions {
  sessionId: string;
  worktreeSessionId: string;
  projectId: string;
  prompt: string;
  attachments?: readonly Attachment[];
  answers?: Readonly<Record<string, PromptAnswer>>;
  questions?: readonly IntakeQuestion[];
  theme?: ThemeOption;
  selection?: ElementSelection;
  blueprintId?: string;
  planFeedback?: readonly string[];
}

export async function recordRequirementTurns<T>(
  answers: Readonly<Record<string, PromptAnswer>> | undefined,
  questions: readonly IntakeQuestion[] | undefined,
  persist: (fields: {
    role: string;
    type: string;
    content: string;
    data?: Record<string, unknown>;
  }) => Promise<T>,
): Promise<T[]> {
  const rows: T[] = [];
  for (const turn of requirementTurns(answers, questions ?? [])) {
    rows.push(
      await persist({
        role: turn.role,
        type: "text",
        content: turn.content,
        data: { intake: true, ...turn.data },
      }),
    );
  }
  return rows;
}

// Persist + enqueue, then return. apps/agent (a separate process) claims
// the Job from Postgres and runs it inside a sandbox, publishing to the
// same session:<id> channel the browser's /stream connection reads from.
export async function enqueueConversation(
  opts: EnqueueConversationOptions,
): Promise<Job> {
  const {
    sessionId,
    worktreeSessionId,
    projectId,
    prompt,
    attachments,
    answers,
    questions,
    theme,
    selection,
    blueprintId,
    planFeedback,
  } = opts;

  const lastMessage = await prisma.message.findFirst({
    where: { sessionId },
    orderBy: { seq: "desc" },
    select: { seq: true },
  });
  let seq = (lastMessage?.seq ?? -1) + 1;

  const persistTurn = async (fields: {
    role: string;
    type: string;
    content: string;
    data?: Record<string, unknown>;
  }) => {
    const row = await prisma.message.create({
      data: {
        sessionId,
        seq,
        role: fields.role,
        type: "text",
        content: fields.content.replaceAll("\u0000", ""),
        ...(fields.data ? { data: fields.data as Prisma.InputJsonValue } : {}),
      },
    });
    publishMessage(sessionId, { kind: "message", seq: row.seq, message: serializeRow(row) });
    seq += 1;
    return row;
  };

  await persistTurn({
    role: "user",
    type: "text",
    content: prompt,
    data: {
      ...(selection ? { selection } : {}),
      ...(attachments && attachments.length > 0 ? { attachments } : {}),
    },
  });
  await recordRequirementTurns(answers, questions, persistTurn);
  if (theme) {
    const turn = themeTurn(theme);
    await persistTurn({
      type: "text",
      ...turn,
      data: {
        ...turn.data,
        ...(blueprintId ? { blueprintId } : {}),
        ...(planFeedback && planFeedback.length > 0 ? { planFeedback } : {}),
      },
    });
  }
  await createSessionWorktree(projectId, worktreeSessionId);
  return enqueueJob({ sessionId, projectId });
}
