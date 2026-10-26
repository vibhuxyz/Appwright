import {
  DeleteEnvironmentVariableRequest,
  EnvironmentOverviewQuerySchema,
  IntegrationEnvironmentSchema,
  PreflightCheckResponse,
  SetEnvironmentVariableRequest,
} from "@repo/contracts";
import {
  deleteProjectEnvironmentVariable,
  getEnvironmentOverview,
  runDeploymentPreflight,
  setProjectEnvironmentVariable,
} from "@repo/db";
import { Router, type Response } from "express";
import { log } from "../log";
import { ownedProjectId } from "../ownership";
import { syncProjectVariablesToVercel } from "./vercel-sync";
import { isReservedEnvironmentKey } from "./environment-security";

export const environmentRouter = Router();

function errorResponse(
  res: Response,
  status: number,
  code: string,
  message: string,
  details: Record<string, unknown> = {},
) {
  const header = res.getHeader("x-request-id");
  const requestId = typeof header === "string" ? header : "";
  return res.status(status).json({
    error: { code, message, details, requestId },
  });
}

environmentRouter.get("/v1/projects/:id/environment", async (req, res) => {
  const projectId = await ownedProjectId(req.params.id, req.userId!);
  if (!projectId) {
    return errorResponse(res, 404, "NOT_FOUND", "Project not found");
  }

  const query = EnvironmentOverviewQuerySchema.safeParse(req.query);
  if (!query.success) {
    return errorResponse(res, 400, "INVALID_INPUT", "A valid environment is required", {
      issues: query.error.issues,
    });
  }

  try {
    const { overview, skipped } = await getEnvironmentOverview({
      projectId,
      environment: query.data.environment,
    });
    if (skipped.length > 0) {
      log.warn("Skipped unknown integrations in environment overview", { projectId, skipped });
    }
    res.json(overview);
  } catch (err) {
    log.error("Failed to load environment overview", {
      projectId,
      err: err instanceof Error ? err.message : String(err),
    });
    errorResponse(res, 500, "INTERNAL_ERROR", "Could not load environment");
  }
});

environmentRouter.post("/v1/projects/:id/environment/variables", async (req, res) => {
  const projectId = await ownedProjectId(req.params.id, req.userId!);
  if (!projectId) {
    return errorResponse(res, 404, "NOT_FOUND", "Project not found");
  }

  const parsed = SetEnvironmentVariableRequest.safeParse(req.body);
  if (!parsed.success) {
    return errorResponse(res, 400, "INVALID_INPUT", "Invalid variable data", {
      issues: parsed.error.issues,
    });
  }

  if (isReservedEnvironmentKey(parsed.data.key)) {
    return errorResponse(res, 422, "RESERVED_ENVIRONMENT_KEY", "System and integration keys must be managed from their dedicated configuration flow");
  }

  try {
    await setProjectEnvironmentVariable({
      projectId,
      ...parsed.data,
    });
    res.json({ ok: true });
  } catch (err) {
    log.error("Failed to set environment variable", {
      projectId,
      key: parsed.data.key,
      err: err instanceof Error ? err.message : String(err),
    });
    errorResponse(res, 500, "INTERNAL_ERROR", "Could not set variable");
  }
});

environmentRouter.delete("/v1/projects/:id/environment/variables", async (req, res) => {
  const projectId = await ownedProjectId(req.params.id, req.userId!);
  if (!projectId) {
    return errorResponse(res, 404, "NOT_FOUND", "Project not found");
  }

  const payload = {
    environment: req.query.environment ?? req.body?.environment,
    key: req.query.key ?? req.body?.key,
  };
  const parsed = DeleteEnvironmentVariableRequest.safeParse(payload);
  if (!parsed.success) {
    return errorResponse(res, 400, "INVALID_INPUT", "Invalid delete request");
  }

  if (isReservedEnvironmentKey(parsed.data.key)) {
    return errorResponse(res, 422, "RESERVED_ENVIRONMENT_KEY", "System and integration keys must be managed from their dedicated configuration flow");
  }

  try {
    await deleteProjectEnvironmentVariable({
      projectId,
      environment: parsed.data.environment,
      key: parsed.data.key,
    });
    res.status(204).end();
  } catch (err) {
    log.error("Failed to delete variable", {
      projectId,
      key: parsed.data.key,
      err: err instanceof Error ? err.message : String(err),
    });
    errorResponse(res, 500, "INTERNAL_ERROR", "Could not delete variable");
  }
});

environmentRouter.post("/v1/projects/:id/environment/preflight", async (req, res) => {
  const projectId = await ownedProjectId(req.params.id, req.userId!);
  if (!projectId) {
    return errorResponse(res, 404, "NOT_FOUND", "Project not found");
  }

  const target = IntegrationEnvironmentSchema.safeParse(req.body?.targetEnvironment);
  if (!target.success) {
    return errorResponse(res, 400, "INVALID_INPUT", "A valid target environment is required");
  }

  try {
    const preflight: PreflightCheckResponse = await runDeploymentPreflight({
      projectId,
      targetEnvironment: target.data,
    });
    res.json(preflight);
  } catch (err) {
    log.error("Preflight check execution failed", {
      projectId,
      err: err instanceof Error ? err.message : String(err),
    });
    errorResponse(res, 500, "INTERNAL_ERROR", "Preflight execution failed");
  }
});

environmentRouter.post("/v1/projects/:id/environment/sync-vercel", async (req, res) => {
  const projectId = await ownedProjectId(req.params.id, req.userId!);
  if (!projectId) {
    return errorResponse(res, 404, "NOT_FOUND", "Project not found");
  }

  const targetEnv = IntegrationEnvironmentSchema.safeParse(req.body?.targetEnvironment);
  if (!targetEnv.success) {
    return errorResponse(res, 400, "INVALID_INPUT", "A valid target environment is required");
  }
  try {
    const result = await syncProjectVariablesToVercel({
      projectId,
      targetEnvironment: targetEnv.data,
    });
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.startsWith("NOT_LINKED")) {
      return errorResponse(res, 400, "NOT_LINKED", "Project is not linked to a Vercel project");
    }
    if (msg.startsWith("NOT_CONNECTED")) {
      return errorResponse(res, 400, "NOT_CONNECTED", "User is not connected to Vercel");
    }
    if (msg.startsWith("INVALID_TARGET")) {
      return errorResponse(res, 400, "INVALID_TARGET", "Cannot sync scope 'all' directly to Vercel");
    }
    log.error("Vercel sync error", { projectId, err: msg });
    errorResponse(res, 500, "INTERNAL_ERROR", "Could not sync variables to Vercel");
  }
});

