import { TestIntegrationRequest } from "@repo/contracts";
import { runIntegrationTest } from "@repo/db";
import { Router } from "express";
import { log } from "../../log";
import { ownedProjectId } from "../../ownership";
import { integrationError } from "../integrations";

export const environmentTestRouter = Router();

environmentTestRouter.post("/v1/projects/:id/environment/test-integration", async (req, res) => {
  if (!req.userId) return integrationError(res, 401, "UNAUTHORIZED", "Authentication required");
  const projectId = await ownedProjectId(req.params.id, req.userId);
  if (!projectId) return integrationError(res, 404, "NOT_FOUND", "Project not found");

  const parsed = TestIntegrationRequest.safeParse(req.body);
  if (!parsed.success) {
    return integrationError(res, 400, "INVALID_INPUT", "Invalid test request", {
      issues: parsed.error.issues,
    });
  }

  try {
    const outcome = await runIntegrationTest({
      projectId,
      actorUserId: req.userId,
      provider: parsed.data.provider,
      environment: parsed.data.environment,
    });
    return res.json({
      provider: outcome.provider,
      status: outcome.status,
      message: outcome.message,
      testedAt: outcome.testedAt,
    });
  } catch (error) {
    log.error("Integration test failed", {
      projectId,
      provider: parsed.data.provider,
      environment: parsed.data.environment,
      err: error instanceof Error ? error.message : String(error),
    });
    return integrationError(res, 500, "INTERNAL_ERROR", "Integration test execution failed");
  }
});
