import {
  RetryProjectDatabaseRequest,
  templateNeedsDatabase,
} from "@repo/contracts";
import {
  prisma,
  ProjectDatabaseError,
  provisionProjectDatabase,
} from "@repo/db";
import { Router } from "express";
import { ownedProjectId } from "../ownership";
import {
  serializeProjectDatabase,
  inspectDatabase,
  getCollectionDocuments,
} from "../project-database";
import { writeProjectRuntimeEnvFile } from "../project-database/write-runtime-env";
import { log } from "../log";

export const projectDatabaseRouter = Router();

function requestIdOf(res: { getHeader(name: string): unknown }): string {
  const header = res.getHeader("x-request-id");
  return typeof header === "string" ? header : "";
}

function failure(
  res: { getHeader(name: string): unknown },
  code: string,
  message: string,
  status: number,
) {
  return {
    status,
    body: {
      error: { code, message, details: {}, requestId: requestIdOf(res) },
    },
  };
}

function fromServiceError(
  res: { getHeader(name: string): unknown },
  err: unknown,
) {
  if (err instanceof ProjectDatabaseError) {
    return failure(res, err.code, err.message, err.httpStatus);
  }
  const message = err instanceof Error ? err.message : "Provisioning failed";
  return failure(res, "PROVISION_FAILED", message, 500);
}

projectDatabaseRouter.get("/v1/projects/:id/databases", async (req, res) => {
  if (!(await ownedProjectId(req.params.id, req.userId!))) {
    return res.status(404).json(failure(res, "NOT_FOUND", "not found", 404).body);
  }
  const rows = await prisma.projectDatabase.findMany({
    where: { projectId: req.params.id },
    orderBy: { createdAt: "asc" },
  });
  res.json({ items: rows.map(serializeProjectDatabase) });
});

projectDatabaseRouter.post(
  "/v1/projects/:id/databases/retry",
  async (req, res) => {
    const parsed = RetryProjectDatabaseRequest.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res
        .status(400)
        .json(failure(res, "INVALID_REQUEST", "Invalid environment", 400).body);
    }
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.userId! },
      select: { id: true, templateId: true },
    });
    if (!project) {
      return res
        .status(404)
        .json(failure(res, "NOT_FOUND", "not found", 404).body);
    }
    if (!templateNeedsDatabase(project.templateId)) {
      return res
        .status(422)
        .json(
          failure(
            res,
            "NOT_DATABASE_BACKED",
            "This project does not use a generated-app database",
            422,
          ).body,
        );
    }

    const started = performance.now();
    try {
      const result = await provisionProjectDatabase({
        projectId: project.id,
        environment: parsed.data.environment,
        actorUserId: req.userId!,
      });
      await writeProjectRuntimeEnvFile({
        projectId: project.id,
        environment: parsed.data.environment,
      }).catch(() => undefined);
      log.info("project database provisioned", {
        projectId: project.id,
        environment: result.environment,
        databaseName: result.databaseName,
        isolationMode: result.isolationMode,
        ms: Math.round(performance.now() - started),
      });
      const row = await prisma.projectDatabase.findUniqueOrThrow({
        where: {
          projectId_environment: {
            projectId: project.id,
            environment:
              parsed.data.environment === "development"
                ? "DEVELOPMENT"
                : parsed.data.environment === "preview"
                  ? "PREVIEW"
                  : "PRODUCTION",
          },
        },
      });
      res.json(serializeProjectDatabase(row));
    } catch (err) {
      const mapped = fromServiceError(res, err);
      log.error("project database provision failed", {
        projectId: project.id,
        environment: parsed.data.environment,
        code: mapped.body.error.code,
        ms: Math.round(performance.now() - started),
      });
      res.status(mapped.status).json(mapped.body);
    }
  },
);

projectDatabaseRouter.get(
  "/v1/projects/:id/database/overview",
  async (req, res) => {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json(failure(res, "UNAUTHORIZED", "Unauthorized", 401).body);
    }
    const result = await inspectDatabase(req.params.id, userId);
    if (!result) {
      return res.status(404).json(failure(res, "NOT_FOUND", "Project not found", 404).body);
    }
    res.json(result);
  },
);

projectDatabaseRouter.get(
  "/v1/projects/:id/database/collections/:name/documents",
  async (req, res) => {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json(failure(res, "UNAUTHORIZED", "Unauthorized", 401).body);
    }
    const limit = Math.min(Number(req.query.limit) || 25, 100);
    const skip = Math.max(Number(req.query.skip) || 0, 0);
    const result = await getCollectionDocuments(
      req.params.id,
      userId,
      req.params.name,
      limit,
      skip,
    );
    if (!result) {
      return res.status(404).json(failure(res, "NOT_FOUND", "Collection not found", 404).body);
    }
    res.json(result);
  },
);

