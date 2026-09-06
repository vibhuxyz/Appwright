import { CreateProjectRequest, type ProjectResponse } from "@repo/contracts";
import { prisma } from "@repo/db";
import { Router } from "express";
import {
  createWorkspace,
  deleteWorkspace,
  getDevServerPort,
  startDevServer,
  stopDevServer,
} from "../workspace/manager";

export const projectRouter = Router();

// Auth is applied once, app-wide, in index.ts. What is local to these routes
// is *ownership*: `userId` sits in the where-clause rather than in an
// if-statement after the lookup, so "not yours" and "not there" are the same
// 404 — and a route cannot forget the check.

function serializeProject(p: {
  id: string;
  name: string;
  templateId: string;
  status: string;
  createdAt: Date;
}): ProjectResponse {
  const port = getDevServerPort(p.id);
  return {
    id: p.id,
    name: p.name,
    templateId: p.templateId,
    status: p.status as ProjectResponse["status"],
    previewUrl: port ? `http://localhost:${port}` : null,
    createdAt: p.createdAt.toISOString(),
  };
}

projectRouter.post("/project", async (req, res) => {
  const body = req.body; // bypassing strict parse to allow templateId
  if (!body.name || typeof body.name !== "string") {
    return res.status(400).json({ error: "name is required" });
  }
  const templateId = body.templateId || "vite-react";

  const project = await prisma.project.create({
    data: { name: body.name, templateId, workspacePath: "", status: "PROVISIONING", userId: req.userId! },
  });

  const workspacePath = await createWorkspace(project.id, templateId);
  const updated = await prisma.project.update({
    where: { id: project.id },
    data: { workspacePath, status: "READY" },
  });

  // Don't block project creation on `bun install` + Vite boot — the preview
  // pane polls until it's healthy.
  startDevServer(project.id).catch((err) => {
    console.error(`dev server failed to start for project ${project.id}:`, err);
  });

  res.status(201).json(serializeProject(updated));
});

projectRouter.get("/projects", async (req, res) => {
  const projects = await prisma.project.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: "desc" },
  });
  res.json(projects.map(serializeProject));
});

projectRouter.get("/project/:id", async (req, res) => {
  const project = await prisma.project.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!project) return res.status(404).json({ error: "not found" });

  if (!getDevServerPort(project.id) && project.status === "READY") {
    // Fire and forget, the frontend polls until previewUrl is populated
    startDevServer(project.id).catch(err => {
      console.error(`dev server failed to restart for project ${project.id}:`, err);
    });
  }

  res.json(serializeProject(project));
});

projectRouter.delete("/project/:id", async (req, res) => {
  const owned = await prisma.project.findFirst({
    where: { id: req.params.id, userId: req.userId! },
    select: { id: true },
  });
  if (!owned) return res.status(404).json({ error: "not found" });

  stopDevServer(req.params.id);
  await deleteWorkspace(req.params.id);
  await prisma.project.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
