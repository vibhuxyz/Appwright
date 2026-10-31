import {
  CreateSessionRequest,
  UpdateSessionRequest,
  canUseModel,
  parseEffortLevel,
  requiredPlanFor,
  type SessionResponse,
} from "@repo/contracts";
import { listAvailableModels } from "@repo/agent-core";
import { prisma } from "@repo/db";
import { Router } from "express";
import { randomUUID } from "node:crypto";
import { PUBLIC_API_URL } from "../env";
import {
  ownedProjectId,
  ownedSessionProjectId,
  ownedSessionWorktree,
} from "../ownership";
import { modelForNewSession } from "../session-model";
import {
  removeSessionWorktree,
  sessionServerKey,
  startSessionDevServer,
  stopDevServer,
} from "../workspace/manager";
import { ensureSessionWorktree } from "../workspace/ensure-session-worktree";
import { sharedWorktreeWhere } from "../workspace/shared-worktree";

function sessionPreviewUrl(previewToken: string | null | undefined): string | null {
  return previewToken ? `${PUBLIC_API_URL}/preview/${previewToken}` : null;
}

export const sessionRouter = Router();

sessionRouter.get("/models", async (_req, res) => {
  res.set("Cache-Control", "private, max-age=60");
  res.json(await listAvailableModels());
});

function serializeSession(s: {
  id: string;
  projectId: string;
  title: string | null;
  model: string;
  effort?: string;
  cost: number;
  tokenIn: number;
  tokenOut: number;
  status: string;
  branch: string | null;
  worktreePath: string | null;
  mode: string;
  devPort: number | null;
  previewToken?: string | null;
  allowedTools?: string[];
  createdAt: Date;
}): SessionResponse {
  return {
    id: s.id,
    projectId: s.projectId,
    title: s.title,
    model: s.model,
    effort: parseEffortLevel(s.effort),
    cost: s.cost,
    tokenIn: s.tokenIn,
    tokenOut: s.tokenOut,
    status: s.status as SessionResponse["status"],
    branch: s.branch,
    worktreePath: s.worktreePath,
    mode: s.mode,
    devPort: s.devPort,
    previewUrl: sessionPreviewUrl(s.previewToken),
    allowedTools: s.allowedTools ?? [],
    createdAt: s.createdAt.toISOString(),
  };
}

sessionRouter.post("/project/:projectId/session", async (req, res) => {
  const body = CreateSessionRequest.parse(req.body);
  if (!(await ownedProjectId(req.params.projectId, req.userId!))) {
    return res.status(404).json({ error: "not found" });
  }
  // D18 — opening a project costs nothing; only sending a message boots a
  // sandbox. The worktree itself is created lazily, the first time a message
  // or a preview actually needs it (enqueueConversation / startSessionDevServer
  // each call createSessionWorktree before using one).
  // createSessionWorktree persists branch/worktreePath onto the session row
  // itself once it has run, so there is one place that does it, not four.
  const model = await modelForNewSession(req.userId!);
  const session = await prisma.session.create({
    data: {
      projectId: req.params.projectId,
      title: body.title,
      model,
    },
  });
  res.status(201).json(serializeSession(session));
});

sessionRouter.get("/project/:projectId/sessions", async (req, res) => {
  const sessions = await prisma.session.findMany({
    where: {
      projectId: req.params.projectId,
      project: { userId: req.userId! },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(sessions.map(serializeSession));
});

sessionRouter.get("/session/:id", async (req, res) => {
  const session = await prisma.session.findFirst({
    where: { id: req.params.id, project: { userId: req.userId! } },
  });
  if (!session) return res.status(404).json({ error: "not found" });
  res.json(serializeSession(session));
});

sessionRouter.put("/session/:id", async (req, res) => {
  const body = UpdateSessionRequest.parse(req.body);
  if (!(await ownedSessionProjectId(req.params.id, req.userId!))) {
    return res.status(404).json({ error: "not found" });
  }
  if (body.mode === "bypass") {
    return res
      .status(422)
      .json({ error: "bypass mode requires a sandbox and is not available yet" });
  }
  if (body.model) {
    const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { plan: true } });
    const plan = user?.plan ?? "FREE";
    if (!canUseModel(plan, body.model)) {
      return res.status(403).json({
        error: {
          code: "MODEL_NOT_IN_PLAN",
          message: `${body.model} needs the ${requiredPlanFor(body.model)} plan`,
          details: { plan, requiredPlan: requiredPlanFor(body.model) },
          requestId: String(res.getHeader("x-request-id") ?? ""),
        },
      });
    }
  }
  const session = await prisma.session.update({
    where: { id: req.params.id },
    data: {
      model: body.model,
      mode: body.mode,
      allowedTools: body.allowedTools,
      effort: body.effort,
    },
  });
  res.json(serializeSession(session));
});

sessionRouter.delete("/session/:id", async (req, res) => {
  const owned = await ownedSessionWorktree(req.params.id, req.userId!);
  if (!owned) {
    return res.status(404).json({ error: "not found" });
  }
  const otherChatsOnWorktree = await prisma.session.count({
    where: {
      ...sharedWorktreeWhere(owned.worktreeSessionId),
      id: { not: req.params.id },
    },
  });
  if (otherChatsOnWorktree === 0) {
    stopDevServer(sessionServerKey(owned.worktreeSessionId));
    await removeSessionWorktree(owned.projectId, owned.worktreeSessionId);
  }
  await prisma.session.delete({
    where: { id: req.params.id },
  });
  res.json({ ok: true });
});

sessionRouter.post("/session/:id/preview", async (req, res) => {
  const owned = await ownedSessionWorktree(req.params.id, req.userId!);
  if (!owned) {
    return res.status(404).json({ error: "not found" });
  }
  const { projectId, worktreeSessionId } = owned;
  const existing = await prisma.session.findUnique({
    where: { id: req.params.id },
    select: { devPort: true, previewToken: true },
  });
  await ensureSessionWorktree(projectId, req.params.id, worktreeSessionId);
  const devPort = await startSessionDevServer(projectId, worktreeSessionId);
  // Keep the token when the port is unchanged so a polling client does not
  // rotate the capability out from under an open iframe. Rotate only when
  // the upstream port changes (restart / reallocate).
  const previewToken =
    existing?.devPort === devPort && existing.previewToken
      ? existing.previewToken
      : randomUUID();
  await prisma.session.update({
    where: { id: req.params.id },
    data: { devPort, previewToken },
  });
  res.json({
    devPort,
    previewUrl: sessionPreviewUrl(previewToken),
  });
});
