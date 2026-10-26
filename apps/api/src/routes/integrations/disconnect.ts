import {
  IntegrationEnvironmentSchema,
  IntegrationProviderSchema,
  isConfigurableIntegrationProvider,
} from "@repo/contracts";
import { disconnectIntegrationConfiguration } from "@repo/db";
import { Router } from "express";
import { ownedProjectId } from "../../ownership";
import { integrationError } from "./error-response";

export const integrationDisconnectRouter = Router();

integrationDisconnectRouter.delete("/v1/projects/:id/integrations/:provider", async (req, res) => {
  if (!req.userId) return integrationError(res, 401, "UNAUTHORIZED", "Authentication required");
  const projectId = await ownedProjectId(req.params.id, req.userId);
  if (!projectId) return integrationError(res, 404, "NOT_FOUND", "Project not found");
  const provider = IntegrationProviderSchema.safeParse(req.params.provider);
  const environment = IntegrationEnvironmentSchema.safeParse(req.query.environment);
  if (!provider.success || !isConfigurableIntegrationProvider(provider.data) || !environment.success) {
    return integrationError(res, 400, "INVALID_INPUT", "A supported integration and environment are required");
  }
  await disconnectIntegrationConfiguration({
    projectId,
    actorUserId: req.userId,
    provider: provider.data,
    environment: environment.data,
  });
  res.status(204).end();
});
