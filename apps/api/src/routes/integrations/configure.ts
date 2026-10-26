import {
  IntegrationConfigurationRequestSchema,
  isConfigurableIntegrationProvider,
  isManagedCredentialAllowed,
  parseIntegrationCredentialValues,
  type IntegrationConfigurationRequest,
} from "@repo/contracts";
import {
  canUseManagedCredentials,
  provisionProjectDatabase,
  ProjectDatabaseError,
  runIntegrationTest,
  saveIntegrationConfiguration,
} from "@repo/db";
import { Router } from "express";
import { log } from "../../log";
import { ownedProjectId } from "../../ownership";
import { integrationError } from "./error-response";

export const integrationConfigurationRouter = Router();

function isManagedDatabase(input: IntegrationConfigurationRequest): boolean {
  return input.provider === "mongodb" && input.credentialMode === "APPWRITE_MANAGED";
}

function managedModeRejection(input: IntegrationConfigurationRequest): { code: string; message: string } | null {
  if (input.credentialMode !== "APPWRITE_MANAGED") return null;
  if (!isManagedCredentialAllowed(input.provider, input.environment)) {
    return { code: "PRODUCTION_CONFIGURATION_REQUIRED", message: "Use your own provider credentials in production" };
  }
  if (Object.keys(input.values).length > 0 || !canUseManagedCredentials(input.provider)) {
    return { code: "MANAGED_MODE_UNAVAILABLE", message: "Appwright test keys are not available for this integration" };
  }
  return null;
}

integrationConfigurationRouter.post("/v1/projects/:id/integrations/configure", async (req, res) => {
  if (!req.userId) return integrationError(res, 401, "UNAUTHORIZED", "Authentication required");
  const projectId = await ownedProjectId(req.params.id, req.userId);
  if (!projectId) return integrationError(res, 404, "NOT_FOUND", "Project not found");

  const parsed = IntegrationConfigurationRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return integrationError(res, 400, "INVALID_INPUT", "Invalid integration configuration", {
      issues: parsed.error.issues,
    });
  }

  const input = parsed.data;
  if (!isConfigurableIntegrationProvider(input.provider)) {
    return integrationError(res, 400, "UNSUPPORTED_INTEGRATION", "This integration cannot be configured here");
  }
  const rejection = managedModeRejection(input);
  if (rejection) return integrationError(res, 422, rejection.code, rejection.message);

  const values = input.credentialMode === "BYOK"
    ? parseIntegrationCredentialValues(input.provider, input.environment, input.values)
    : {};
  if (!values) {
    return integrationError(res, 400, "INVALID_CREDENTIALS", "The submitted provider credentials are invalid");
  }

  try {
    if (isManagedDatabase(input)) {
      await provisionProjectDatabase({ projectId, environment: input.environment, actorUserId: req.userId });
    }
    await saveIntegrationConfiguration({
      projectId,
      actorUserId: req.userId,
      provider: input.provider,
      environment: input.environment,
      credentialMode: input.credentialMode,
      values,
    });
    const outcome = await runIntegrationTest({
      projectId,
      actorUserId: req.userId,
      provider: input.provider,
      environment: input.environment,
    });
    return res.json({
      provider: input.provider,
      credentialMode: input.credentialMode,
      environment: input.environment,
      status: outcome.status,
      configuredFields: Object.keys(values),
      lastTestedAt: outcome.testedAt,
      lastError: outcome.status === "test_failed" ? outcome.message : null,
      message: outcome.message,
    });
  } catch (error) {
    if (error instanceof ProjectDatabaseError) {
      return integrationError(res, 422, "DATABASE_PROVISION_FAILED", `Could not provision the Appwright ${input.environment} database`, {
        reason: error.code,
      });
    }
    log.error("Integration configuration failed", {
      projectId,
      provider: input.provider,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return integrationError(res, 500, "INTEGRATION_CONFIG_FAILED", "Could not save and test integration configuration");
  }
});
