import { CreateProjectRequest, type ProjectResponse } from "@repo/contracts";
import { prisma, scheduleProjectDatabaseDeletions } from "@repo/db";
import { Router } from "express";
import { log } from "../log";
import {
  createWorkspace,
  deleteWorkspace,
  getDevServerPort,
  startDevServer,
  stopDevServer,
} from "../workspace/manager";
import { getProjectOverview } from "../project";

export const projectRouter = Router();

function serializeProject(p: {
  id: string;
  name: string;
  templateId: string;
  starterId: string | null;
  status: string;
  vercelProjectId: string | null;
  createdAt: Date;
}): ProjectResponse {
  const port = getDevServerPort(p.id);
  return {
    id: p.id,
    name: p.name,
    templateId: p.templateId,
    starterId: p.starterId,
    status: p.status as ProjectResponse["status"],
    previewUrl: port ? `http://localhost:${port}` : null,
    hasProductionDeployment: p.vercelProjectId !== null,
    createdAt: p.createdAt.toISOString(),
  };
}

projectRouter.post("/project", async (req, res) => {
  const parsed = CreateProjectRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: {
        code: "INVALID_REQUEST",
        message: "name is required",
        details: {},
        requestId: "",
      },
    });
  }
  const { name, templateId, starterId, integrations } = parsed.data;

  const project = await prisma.project.create({
    data: {
      name,
      templateId,
      starterId,
      workspacePath: "",
      status: "PROVISIONING",
      userId: req.userId!,
    },
  });

  try {
    await prisma.$transaction(
      integrations.map((provider) =>
        prisma.projectIntegration.upsert({
          where: { projectId_provider: { projectId: project.id, provider } },
          create: { projectId: project.id, provider, required: true, status: "missing" },
          update: { required: true },
        }),
      ),
    );
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
  } catch (err) {
    await prisma.project
      .update({
        where: { id: project.id },
        data: { status: "ERROR" },
      })
      .catch(() => undefined);
    const message = "Project provisioning failed";
    const code = "PROVISION_FAILED";
    const status = 500;
    log.error("project create failed", {
      projectId: project.id,
      code,
    });
    res.status(status).json({
      error: { code, message, details: {}, requestId: "" },
    });
  }
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

projectRouter.get("/v1/projects/:id/overview", async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Unauthorized", details: {}, requestId: "" },
    });
  }

  const overview = await getProjectOverview(req.params.id, userId);
  if (!overview) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "Project not found", details: {}, requestId: "" },
    });
  }

  res.json(overview);
});


projectRouter.delete("/project/:id", async (req, res) => {
  const projectId = req.params.id;
  if (!projectId) {
    return res.status(400).json({ error: "id is required" });
  }

  if (projectId.endsWith("-sample") || projectId.includes("sample")) {
    return res.status(204).end();
  }

  const existing = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, userId: true },
  });

  if (!existing) {
    return res.status(204).end();
  }

  if (existing.userId !== req.userId) {
    return res.status(404).json({ error: "not found" });
  }

  stopDevServer(projectId);
  await scheduleProjectDatabaseDeletions(projectId);
  await deleteWorkspace(projectId);
  await prisma.project.delete({ where: { id: projectId } });
  res.status(204).end();
});
