import { cancelFlagKey, CANCEL_FLAG_TTL_SECONDS, set as cacheSet } from "@repo/cache";
import { SendMessageRequest } from "@repo/contracts";
import { prisma } from "@repo/db";
import { Router } from "express";
import { requireAuthAllowingQueryToken } from "@repo/auth";
import { setTraceContext } from "@repo/logger";
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
streamRouter.use(requireAuthAllowingQueryToken);
streamRouter.use((req, _res, next) => {
  if (req.userId) {
    setTraceContext({ userId: req.userId });
  }
  next();
});

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

streamRouter.get("/stream/:sessionId", async (req, res) => {
  if (!(await ownedSessionProjectId(req.params.sessionId, req.userId!))) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "session not found" },
    });
  }
  const afterSeq = req.query.afterSeq ? Number(req.query.afterSeq) : -1;
  attachSseClient(req.params.sessionId, res, afterSeq);
});

conversationRouter.post("/conversation", async (req, res) => {
  const body = SendMessageRequest.parse(req.body);
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
      prompt: body.prompt,
    });
    res.status(202).json({ jobId: job.id, sessionId: session.id });
    return;
  }

  await runConversation({
    sessionId: session.id,
    userId: req.userId!,
    prompt: body.prompt,
    res,
  });
});
