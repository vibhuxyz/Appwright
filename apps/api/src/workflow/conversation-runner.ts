import {
  buildSystemPrompt,
  LocalRuntime,
  OpenAiProvider,
  runAgentLoop,
  type Message as CoreMessage,
} from "@repo/agent-core";
import type { ElementSelection } from "@repo/contracts";
import { prisma, type Prisma } from "@repo/db";
import { classify, resolvePolicy, type VerifyOutcome } from "@repo/decision-engine";
import { applyPromptAnswers, type IntakeQuestion, type PromptAnswer } from "@repo/planner";
import { ALL_TOOLS } from "@repo/tools";
import type { Response } from "express";
import { log } from "../log";
import { buildSelectionPrompt, locateSelectionSource } from "../selection";
import {
  attachSseClient,
  publishMessage,
  publishStatus,
} from "../stream/sse";
import { createSessionWorktree } from "../workspace/manager";
import { createApprovalHook } from "./approval-gate";
import { serializeRow, toCoreMessage, type MessageRow } from "./message-mapper";
import { resolveStopNotice } from "./stop-notice";
import { createAgentEventHandler } from "./agent-event-handler";
import { runVerifyStep } from "./verify-step";
import { runTaskPlanStep } from "./task-plan-step";
import { finalizeRun } from "./finalize-run";
import { recordRequirementTurns } from "./enqueue-conversation";

export const activeControllers = new Map<string, AbortController>();

export interface RunConversationOptions {
  sessionId: string;
  userId: string;
  prompt: string;
  answers?: Readonly<Record<string, PromptAnswer>>;
  questions?: readonly IntakeQuestion[];
  selection?: ElementSelection;
  res: Response;
}

export async function runConversation(opts: RunConversationOptions): Promise<void> {
  const { sessionId, userId, prompt, res } = opts;
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) return;

  const priorRows = await prisma.message.findMany({
    where: { sessionId: session.id },
    orderBy: { seq: "asc" },
  });
  let seqCounter = (priorRows.at(-1)?.seq ?? -1) + 1;

  attachSseClient(session.id, res, -1);

  async function persist(fields: {
    role: string;
    type: string;
    content: string;
    data?: Record<string, unknown>;
  }): Promise<MessageRow> {
    const row = await prisma.message.create({
      data: {
        sessionId: session!.id,
        seq: seqCounter++,
        ...fields,
        content: fields.content.replaceAll("\u0000", ""),
        data: fields.data as Prisma.InputJsonValue | undefined,
      },
    });
    publishMessage(session!.id, {
      kind: "message",
      seq: row.seq,
      message: serializeRow(row),
    });
    return row;
  }

  const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { credits: true } });
  if (!currentUser || currentUser.credits <= 0) {
    const notice = resolveStopNotice("outOfCredits");
    publishStatus(session.id, "IDLE", notice.detail, notice.stopReason);
    await persist({ role: "assistant", type: "text", content: notice.content, data: { stopReason: notice.stopReason } });
    if (!res.writableEnded) res.status(402).json({ error: notice.detail });
    return;
  }
  const userRow = await persist({ role: "user", type: "text", content: prompt });
  const answerRows = await recordRequirementTurns(opts.answers, opts.questions, persist);
  await prisma.session.update({ where: { id: session.id }, data: { status: "RUNNING" } });
  publishStatus(session.id, "RUNNING", "Analyzing request…");
  const controller = new AbortController();
  activeControllers.set(session.id, controller);
  const { emit } = createAgentEventHandler({ sessionId: session.id, userId, persist });
  const MAX_VERIFY_ATTEMPTS = 2;
  const verifyHistory: VerifyOutcome[] = [];
  let finalStopReason = "completed";
  let finalReason: string | undefined;
  let finalDetail: string | undefined;
  let verificationPassed = false;

  try {
    const worktreeDir = await createSessionWorktree(session.projectId, session.id);
    const runtime = new LocalRuntime(session.projectId, session.id);
    const systemPrompt = await buildSystemPrompt(runtime);
    const systemMessage: CoreMessage = { role: "user", type: "text", content: systemPrompt };
    const planningProvider = new OpenAiProvider({ model: session.model });
    const answeredPrompt = applyPromptAnswers(prompt, opts.answers, opts.questions ?? []);
    const modelPrompt = opts.selection
      ? buildSelectionPrompt(
          answeredPrompt,
          opts.selection,
          await locateSelectionSource(worktreeDir, opts.selection),
        )
      : answeredPrompt;
    const decisionResult = await classify(modelPrompt, planningProvider);
    const policy = resolvePolicy(decisionResult);
    const plannerSkipped = policy === "direct" || policy === "blocked";
    log.info("decision", { sessionId: session.id, status: decisionResult.status, decision: decisionResult.decision, policy, plannerSkipped });

    const planMessage = plannerSkipped
      ? undefined
      : await runTaskPlanStep({
          sessionId: session.id,
          prompt: modelPrompt,
          runtime,
          provider: planningProvider,
          persist,
        });

    const messages: CoreMessage[] = [
      systemMessage,
      ...priorRows.map(toCoreMessage),
      toCoreMessage(userRow),
      ...answerRows.map(toCoreMessage),
      ...(planMessage ? [planMessage] : []),
    ];

    for (let attempt = 0; attempt <= MAX_VERIFY_ATTEMPTS; attempt++) {
      if (policy === "blocked") {
        const notice = resolveStopNotice("blocked");
        finalStopReason = notice.stopReason;
        finalReason = notice.stopReason;
        finalDetail = notice.detail;
        await persist({ role: "assistant", type: "text", content: notice.content, data: { stopReason: notice.stopReason } });
        break;
      }

      if (controller.signal.aborted) {
        const notice = resolveStopNotice("cancelled");
        finalStopReason = notice.stopReason;
        finalReason = notice.stopReason;
        finalDetail = notice.detail;
        break;
      }

      const userCheck = await prisma.user.findUnique({ where: { id: userId }, select: { credits: true } });
      const remainingCredits = userCheck?.credits ?? 0;
      if (remainingCredits <= 0) {
        const notice = resolveStopNotice("outOfCredits");
        finalStopReason = notice.stopReason;
        finalReason = notice.stopReason;
        finalDetail = notice.detail;
        await persist({ role: "assistant", type: "text", content: notice.content, data: { stopReason: notice.stopReason } });
        break;
      }

      const stopReason = await runAgentLoop({
        messages,
        tools: ALL_TOOLS,
        provider: new OpenAiProvider({ model: session.model }),
        runtime,
        emit,
        budget: {
          maxIterations: 60,
          maxTokens: Math.max(500, Math.min(remainingCredits, 2_000_000)),
          maxCostUsd: 5,
          deadline: Date.now() + 10 * 60_000,
        },
        signal: controller.signal,
        sessionId: session.id,
        onApprovalRequired: createApprovalHook(session.id, session.mode, controller.signal),
      });
      finalStopReason = stopReason;
      finalReason = stopReason;

      if (stopReason === "cancelled" || stopReason === "maxIterations" || stopReason === "timeout" || stopReason === "fatalError") {
        const notice = resolveStopNotice(stopReason);
        finalDetail = notice.detail;
        await persist({ role: "assistant", type: "text", content: notice.content, data: { stopReason } });
        break;
      }

      if (stopReason === "budgetExceeded") {
        const postRunUser = await prisma.user.findUnique({ where: { id: userId }, select: { credits: true } });
        const notice = resolveStopNotice("budgetExceeded", (postRunUser?.credits ?? 0) <= 0);
        finalStopReason = notice.stopReason;
        finalReason = notice.stopReason;
        finalDetail = notice.detail;
        await persist({ role: "assistant", type: "text", content: notice.content, data: { stopReason: notice.stopReason } });
        break;
      }

      if (stopReason !== "completed") break;

      const verify = await runVerifyStep({
        projectId: session.projectId,
        sessionId: session.id,
        maxAttempts: MAX_VERIFY_ATTEMPTS,
        history: verifyHistory,
      });

      if (verify.passed) {
        verificationPassed = true;
        break;
      }

      if (!verify.shouldRetry) {
        log.info("verification gave up", { sessionId: session.id, attempts: verifyHistory.length, stuck: verify.stuck });
        await persist({
          role: "assistant",
          type: "text",
          content: verify.stuck
            ? "❌ Verification failed with the same error as the last attempt — retrying wouldn't help. Giving up."
            : `❌ Verification still failing after ${MAX_VERIFY_ATTEMPTS} attempts. Giving up.`,
          data: { stopReason: "fatalError", verification: verify.results },
        });
        finalStopReason = "fatalError";
        finalReason = "fatalError";
        finalDetail = verify.stuck ? "Verification failed twice with the same error" : "Verification failed after multiple attempts";
        break;
      }

      messages.push({
        role: "user",
        type: "text",
        content: `Running verification checks on your changes found real errors — fix them, then\nstop. Do not describe the fix, make it with edit_file/write_file.\n\n${verify.outputText}`,
      });
      await persist({ role: "user", type: "text", content: `Verification failed, retrying:\n${verify.outputText}` });
    }

    if (finalStopReason !== "fatalError") {
      await finalizeRun({ projectId: session.projectId, sessionId: session.id, prompt, verificationPassed, persist });
    }

    await prisma.session.update({
      where: { id: session.id },
      data: { status: finalStopReason === "fatalError" ? "ERROR" : "IDLE" },
    });
  } catch (err) {
    finalStopReason = "fatalError";
    finalReason = "fatalError";
    finalDetail = err instanceof Error ? err.message : "Execution error";
    log.error("run failed", { sessionId: session.id, err: String(err) });
    await prisma.session.update({ where: { id: session.id }, data: { status: "ERROR" } });
    await persist({ role: "assistant", type: "text", content: `The run stopped before finishing: ${finalDetail}`, data: { stopReason: "fatalError" } });
  } finally {
    activeControllers.delete(session.id);
    publishStatus(session.id, finalStopReason === "fatalError" ? "ERROR" : "IDLE", finalDetail, finalReason);
    if (!res.writableEnded) res.end();
  }
}
