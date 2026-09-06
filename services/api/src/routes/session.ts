import {
  CreateSessionRequest,
  UpdateSessionRequest,
  type SessionResponse,
} from "@repo/contracts";
import { DEFAULT_MODEL } from "@repo/agent-core";
import { prisma } from "@repo/db";
import { Router } from "express";
import { ownedProjectId, ownedSessionProjectId } from "../auth";

export const sessionRouter = Router();

function serializeSession(s: {
  id: string;
  projectId: string;
  title: string | null;
  model: string;
  cost: number;
  tokenIn: number;
  tokenOut: number;
  status: string;
  createdAt: Date;
}): SessionResponse {
  return {
    id: s.id,
    projectId: s.projectId,
    title: s.title,
    model: s.model,
    cost: s.cost,
    tokenIn: s.tokenIn,
    tokenOut: s.tokenOut,
    status: s.status as SessionResponse["status"],
    createdAt: s.createdAt.toISOString(),
  };
}

sessionRouter.post("/project/:projectId/session", async (req, res) => {
  const body = CreateSessionRequest.parse(req.body);
  if (!(await ownedProjectId(req.params.projectId, req.userId!))) {
    return res.status(404).json({ error: "not found" });
  }
  const session = await prisma.session.create({
    data: { projectId: req.params.projectId, title: body.title, model: DEFAULT_MODEL },
  });
  res.status(201).json(serializeSession(session));
});

sessionRouter.get("/project/:projectId/sessions", async (req, res) => {
  const sessions = await prisma.session.findMany({
    where: { projectId: req.params.projectId, project: { userId: req.userId! } },
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
  const session = await prisma.session.update({
    where: { id: req.params.id },
    data: { model: body.model },
  });
  res.json(serializeSession(session));
});
