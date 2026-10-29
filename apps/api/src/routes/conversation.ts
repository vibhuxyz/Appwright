import { OpenAiProvider, plannerModel, providerFor } from "@repo/agent-core";
import { cancelFlagKey, CANCEL_FLAG_TTL_SECONDS, set as cacheSet } from "@repo/cache";
import {
  PromptQuestionsRequest,
  PromptQuestionsResponse,
  SendMessageRequest,
} from "@repo/contracts";
import { prisma } from "@repo/db";
import { worktreeSessionIdOf } from "@repo/workspace";
import { Router } from "express";
import { requireAuthAllowingQueryToken } from "@repo/auth";
import { setTraceContext } from "@repo/logger";
import { analysisForPrompt, IntakeQuestionsError, persistChatTurn, runIntakeRound } from "../intake";
import { log } from "../log";
import { ownedBlueprintSessionId, ownedSessionProjectId } from "../ownership";
import { attachSseClient, publishIntakeProgress, publishStatus } from "../stream/sse";
import {
  hasRunCapacity,
  isWorktreeBusy,
  WORKTREE_BUSY_MESSAGE,
} from "../workflow/run-limit";
import { enqueueConversation } from "../workflow/enqueue-conversation";
import { serializeRow } from "../workflow/message-mapper";
import { conversationRateLimitOk, hasUserSandboxCapacity } from "../workflow/rate-limit";

export const conversationRouter = Router();

export const streamRouter = Router();
// Auth is scoped to /stream/* only. A root-level streamRouter.use(requireAuth…)
// would 401 every later public mount (preview) — see apps/api/src/index.ts.
const streamAuthed = Router({ mergeParams: true });
streamAuthed.use(requireAuthAllowingQueryToken);
streamAuthed.use((req, _res, next) => {
  if (req.userId) setTraceContext({ userId: req.userId });
  next();
});
streamRouter.use("/stream", streamAuthed);

conversationRouter.get("/conversations/:sessionId", async (req, res) => {
  if (!(await ownedSessionProjectId(req.params.sessionId, req.userId!))) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "session not found" },
    });
  }
  const afterSeq = req.query.afterSeq ? Number(req.query.afterSeq) : -1;
  const rows = await prisma.message.findMany({
    where: { sessionId: req.params.sessionId, seq: { gt: afterSeq } },
    orderBy: { seq: "asc" },
  });
  res.json(rows.map(serializeRow));
});

conversationRouter.post("/conversation/:sessionId/stop", async (req, res) => {
  if (!(await ownedSessionProjectId(req.params.sessionId, req.userId!))) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "session not found" },
    });
  }
  await cacheSet(cancelFlagKey(req.params.sessionId), true, CANCEL_FLAG_TTL_SECONDS).catch(() => {});
  await prisma.session.update({
    where: { id: req.params.sessionId },
    data: { status: "IDLE" },
  });
  publishStatus(req.params.sessionId, "IDLE", "Stopped by user", "cancelled");
  res.json({ ok: true, stopped: true });
});

streamAuthed.get("/:sessionId", async (req, res) => {
  if (!(await ownedSessionProjectId(req.params.sessionId, req.userId!))) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "session not found" },
    });
  }
  const afterSeq = req.query.afterSeq ? Number(req.query.afterSeq) : -1;
  attachSseClient(req.params.sessionId, res, afterSeq);
});

function requestIdOf(res: { getHeader(name: string): unknown }): string {
  const value = res.getHeader("x-request-id");
  return typeof value === "string" ? value : "";
}

conversationRouter.post("/conversation/questions", async (req, res) => {
  const parsed = PromptQuestionsRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: {
        code: "INVALID_REQUEST",
        message: "Prompt is required",
        details: {},
        requestId: requestIdOf(res),
      },
    });
  }
  if (!(await conversationRateLimitOk(req.userId!))) {
    return res.status(429).json({
      error: {
        code: "TOO_MANY_REQUESTS",
        message: "Too many requests. Slow down and try again shortly.",
        details: {},
        requestId: requestIdOf(res),
      },
    });
  }
  const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { credits: true, plan: true } });
  if (!user || user.credits <= 0) {
    return res.status(402).json({
      error: { code: "OUT_OF_CREDITS", message: "Out of credits", details: {}, requestId: requestIdOf(res) },
    });
  }
  try {
    const provider = new OpenAiProvider({ model: plannerModel(user.plan) });
    log.info("intake questions model", { userId: req.userId, model: provider.model, provider: providerFor(provider.model) });
    const sessionId = parsed.data.sessionId;
    const projectId = sessionId ? await ownedSessionProjectId(sessionId, req.userId!) : null;
    const { questions, action, reply, analysis } = await runIntakeRound({
      request: parsed.data,
      projectId,
      provider,
      onProgress: (progress) => {
        if (sessionId && projectId) publishIntakeProgress(sessionId, progress);
      },
    });
    if (action === "reply" && reply && sessionId) {
      await persistChatTurn({ sessionId, prompt: parsed.data.prompt, reply });
    }
    const body = PromptQuestionsResponse.safeParse({ questions, action, analysis });
    if (!body.success) {
      throw new IntakeQuestionsError(
        "GENERATION_FAILED",
        "Could not generate questions for this prompt",
      );
    }
    res.json(body.data);
  } catch (error) {
    const timeout = error instanceof IntakeQuestionsError && error.code === "TIMEOUT";
    const message =
      error instanceof IntakeQuestionsError
        ? error.message
        : "Could not generate questions. Try again.";
    log.error("intake questions failed", {
      userId: req.userId,
      code: timeout ? "GENERATION_TIMEOUT" : "GENERATION_FAILED",
      message: error instanceof IntakeQuestionsError ? message : String(error),
    });
    return res.status(503).json({
      error: {
        code: timeout ? "GENERATION_TIMEOUT" : "GENERATION_FAILED",
        message,
        details: {},
        requestId: requestIdOf(res),
      },
    });
  }
});

conversationRouter.post("/conversation", async (req, res) => {
  const body = SendMessageRequest.parse(req.body);
  const prompt = body.prompt;
  const answers = body.answers;
  const session = await prisma.session.findFirst({
    where: { id: body.sessionId, project: { userId: req.userId! } },
  });
  if (!session) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "session not found" },
    });
  }

  if (body.blueprintId && (await ownedBlueprintSessionId(body.blueprintId, req.userId!)) !== session.id) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "plan not found for this session" },
    });
  }

  if (!(await conversationRateLimitOk(req.userId!))) {
    return res.status(429).json({
      error: {
        code: "TOO_MANY_REQUESTS",
        message: "Too many requests. Slow down and try again shortly.",
      },
    });
  }

  if (!(await hasRunCapacity(session.projectId, session.id))) {
    return res.status(429).json({
      error: {
        code: "TOO_MANY_REQUESTS",
        message: "Too many sessions running on this project. Wait for one to finish.",
      },
    });
  }

  if (!(await hasUserSandboxCapacity(req.userId!))) {
    return res.status(429).json({
      error: {
        code: "TOO_MANY_REQUESTS",
        message: "Too many sandboxes running across your projects. Wait for one to finish.",
      },
    });
  }

  const worktreeSessionId = worktreeSessionIdOf(session);
  if (await isWorktreeBusy(worktreeSessionId, session.id)) {
    return res.status(409).json({
      error: { code: "WORKTREE_BUSY", message: WORKTREE_BUSY_MESSAGE },
    });
  }

  const job = await enqueueConversation({
    sessionId: session.id,
    worktreeSessionId,
    projectId: session.projectId,
    prompt,
    attachments: body.attachments,
    answers,
    questions: body.questions,
    theme: body.theme,
    selection: body.selection,
    blueprintId: body.blueprintId,
    planFeedback: body.planFeedback,
    analysis: await analysisForPrompt(body.analysis, prompt),
  });
  res.status(202).json({ jobId: job.id, sessionId: session.id });
});
