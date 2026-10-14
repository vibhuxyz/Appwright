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
import { serializeRow } from "../workflow/message-mapper";

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

  if (!(await hasRunCapacity(session.projectId, session.id))) {
    return res.status(429).json({
      error: {
        code: "TOO_MANY_REQUESTS",
        message: "Too many sessions running on this project. Wait for one to finish.",
      },
    });
  }

  await runConversation({
    sessionId: session.id,
    userId: req.userId!,
    prompt: body.prompt,
    res,
  });
});
