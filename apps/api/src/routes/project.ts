import { CreateProjectRequest, type ProjectResponse } from "@repo/contracts";
import { prisma } from "@repo/db";
import { Router } from "express";
import { log } from "../log";
import {
  createWorkspace,
  deleteWorkspace,
  getDevServerPort,
  startDevServer,
  stopDevServer,
} from "../workspace/manager";

export const projectRouter = Router();

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
    data: {
      name: body.name,
      templateId,
      workspacePath: "",
      status: "PROVISIONING",
      userId: req.userId!,
    },
  });

  const workspacePath = await createWorkspace(project.id, templateId);
  const updated = await prisma.project.update({
    where: { id: project.id },
    data: { workspacePath, status: "READY" },
  });


  startDevServer(project.id).catch((err) => {
    log.error("dev server failed to start", {
      projectId: project.id,
      err: String(err),
    });
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
  const project = await prisma.project.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!project) return res.status(404).json({ error: "not found" });

  if (!getDevServerPort(project.id) && project.status === "READY") {

    startDevServer(project.id).catch((err) => {
      log.error("dev server failed to restart", {
        projectId: project.id,
        err: String(err),
      });
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
