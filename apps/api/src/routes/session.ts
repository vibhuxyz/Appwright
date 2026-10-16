import {
  CreateSessionRequest,
  UpdateSessionRequest,
  type AvailableModel,
  type SessionResponse,
} from "@repo/contracts";
import { DEFAULT_MODEL } from "@repo/agent-core";
import { prisma } from "@repo/db";
import { Router } from "express";
import { randomUUID } from "node:crypto";
import { ownedProjectId, ownedSessionProjectId } from "../ownership";
import {
  createSessionWorktree,
  removeSessionWorktree,
  sessionServerKey,
  startSessionDevServer,
  stopDevServer,
} from "../workspace/manager";

export const sessionRouter = Router();

const AVAILABLE_MODELS: AvailableModel[] = [
  {
    id: "gemini-3.7-flash",
    name: "Gemini 3.7 Flash",
    provider: "Google",
    description: "Hybrid reasoning & ultra-fast generation",
    badge: "Recommended",
    isDefault: true,
  },
  {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro",
    provider: "Google",
    description: "Advanced reasoning for complex codebase tasks",
  },
  {
    id: "gpt-5.4",
    name: "GPT-5.4",
    provider: "OpenAI",
    description: "Flagship frontier intelligence for deep challenges",
    badge: "Usage credits",
  },
  {
    id: "gpt-5.4-mini",
    name: "GPT-5.4 Mini",
    provider: "OpenAI",
    description: "Fast, cost-efficient model for everyday coding",
  },
  {
    id: "gpt-5.2-codex",
    name: "GPT-5.2 Codex",
    provider: "OpenAI",
    description: "High-precision code synthesis & refactoring",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    description: "Lightweight fast completions",
  },
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B",
    provider: "Groq",
    description: "High-throughput open-weights model via Groq",
  },
  {
    id: "openai/gpt-oss-120b",
    name: "GPT-OSS 120B",
    provider: "Groq",
    description: "Massive open-source intelligence hosted on Groq",
  },
  {
    id: "openai/gpt-oss-20b",
    name: "GPT-OSS 20B",
    provider: "Groq",
    description: "Fast lightweight open model",
  },
  {
    id: "qwen/qwen3.6-27b",
    name: "Qwen 3.6 27B",
    provider: "Groq",
    description: "Leading multi-lingual and coding open model",
  },
  {
    id: "grok-beta",
    name: "Grok Beta",
    provider: "xAI",
    description: "Real-time frontier intelligence by xAI",
  },
];

sessionRouter.get("/models", (_req, res) => {
  res.json(AVAILABLE_MODELS);
});

function serializeSession(s: {
  id: string;
  projectId: string;
  title: string | null;
  model: string;
  cost: number;
  tokenIn: number;
  tokenOut: number;
  status: string;
  branch: string | null;
  worktreePath: string | null;
  mode: string;
  devPort: number | null;
  allowedTools?: string[];
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
    branch: s.branch,
    worktreePath: s.worktreePath,
    mode: s.mode,
    devPort: s.devPort,
    allowedTools: s.allowedTools ?? [],
    createdAt: s.createdAt.toISOString(),
  };
}

sessionRouter.post("/project/:projectId/session", async (req, res) => {
  const body = CreateSessionRequest.parse(req.body);
  if (!(await ownedProjectId(req.params.projectId, req.userId!))) {
    return res.status(404).json({ error: "not found" });
  }
  const session = await prisma.session.create({
    data: {
      projectId: req.params.projectId,
      title: body.title,
      model: DEFAULT_MODEL,
    },
  });
  const worktreePath = await createSessionWorktree(
    req.params.projectId,
    session.id,
  );
  const withWorktree = await prisma.session.update({
    where: { id: session.id },
    data: { branch: `agent/${session.id}`, worktreePath },
  });
  res.status(201).json(serializeSession(withWorktree));
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
  const session = await prisma.session.update({
    where: { id: req.params.id },
    data: {
      model: body.model,
      mode: body.mode,
      allowedTools: body.allowedTools,
    },
  });
  res.json(serializeSession(session));
});

sessionRouter.delete("/session/:id", async (req, res) => {
  const projectId = await ownedSessionProjectId(req.params.id, req.userId!);
  if (!projectId) {
    return res.status(404).json({ error: "not found" });
  }
  stopDevServer(sessionServerKey(req.params.id));
  await removeSessionWorktree(projectId, req.params.id);
  await prisma.session.delete({
    where: { id: req.params.id },
  });
  res.json({ ok: true });
});

sessionRouter.post("/session/:id/preview", async (req, res) => {
  const projectId = await ownedSessionProjectId(req.params.id, req.userId!);
  if (!projectId) {
    return res.status(404).json({ error: "not found" });
  }
  const devPort = await startSessionDevServer(projectId, req.params.id);
  // Rotated on every call: a new dev server means a new capability, and an
  // old link stops working instead of pointing at whatever starts next on
  // the same port.
  const previewToken = randomUUID();
  await prisma.session.update({
    where: { id: req.params.id },
    data: { devPort, previewToken },
  });
  res.json({ devPort, previewUrl: `/preview/${previewToken}` });
});
