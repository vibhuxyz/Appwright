import { cancelFlagKey, CANCEL_FLAG_TTL_SECONDS, set as cacheSet } from "@repo/cache";
import { PromptQuestionsRequest, SendMessageRequest } from "@repo/contracts";
import { prisma } from "@repo/db";
import { Router } from "express";
import { requireAuthAllowingQueryToken } from "@repo/auth";
import { setTraceContext } from "@repo/logger";
import { generateIntakeQuestions, IntakeQuestionsError } from "../intake";
import { log } from "../log";
import { ownedSessionProjectId } from "../ownership";
import { attachSseClient, publishStatus } from "../stream/sse";
import { hasRunCapacity } from "../workflow/run-limit";
import {
  activeControllers,
  runConversation,
} from "../workflow/conversation-runner";
import { enqueueConversation } from "../workflow/enqueue-conversation";
import { serializeRow } from "../workflow/message-mapper";
import { conversationRateLimitOk, hasUserSandboxCapacity } from "../workflow/rate-limit";

// Additive V3 path, off by default. The synchronous in-process path
// (runConversation) stays the default so existing behavior doesn't change
// underfoot; flip this once apps/web opens /stream before posting here in
// sandboxed mode (not done yet — see the V3 doc's open items).
const EXECUTION_MODE_SANDBOXED = process.env.EXECUTION_MODE === "sandboxed";

export { activeControllers };

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
  const controller = activeControllers.get(req.params.sessionId);
  if (controller) {
    controller.abort();
    activeControllers.delete(req.params.sessionId);
  }
  // Harmless when the in-process path handled it above; load-bearing when
  // a sandboxed worker in another process owns this run instead.
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
  try {
    const questions = await generateIntakeQuestions(parsed.data.prompt);
    res.json({ questions });
  } catch (error) {
    const timeout = error instanceof IntakeQuestionsError && error.code === "TIMEOUT";
    log.error("intake questions failed", {
      code: timeout ? "GENERATION_TIMEOUT" : "GENERATION_FAILED",
    });
    return res.status(503).json({
      error: {
        code: timeout ? "GENERATION_TIMEOUT" : "GENERATION_FAILED",
        message: timeout
          ? "Timed out while choosing questions"
          : "Could not generate questions. Try again.",
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

  if (EXECUTION_MODE_SANDBOXED) {
    const job = await enqueueConversation({
      sessionId: session.id,
      projectId: session.projectId,
      prompt,
      answers,
      questions: body.questions,
    });
    res.status(202).json({ jobId: job.id, sessionId: session.id });
    return;
  }

  await runConversation({
    sessionId: session.id,
    userId: req.userId!,
    prompt,
    answers,
    questions: body.questions,
    selection: body.selection,
    res,
  });
});
