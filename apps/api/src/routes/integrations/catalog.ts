import {
  INTEGRATION_CATALOG,
  IntegrationCatalogResponseSchema,
  type CredentialMode,
} from "@repo/contracts";
import { canUseManagedCredentials, getIntegrationUsageSummary, prisma } from "@repo/db";
import { Router } from "express";
import { PUBLIC_API_URL } from "../../env";
import { ownedProjectId } from "../../ownership";
import { integrationError } from "./error-response";

export const integrationCatalogRouter = Router();

integrationCatalogRouter.get("/v1/projects/:id/integrations", async (req, res) => {
  if (!req.userId) return integrationError(res, 401, "UNAUTHORIZED", "Authentication required");
  const projectId = await ownedProjectId(req.params.id, req.userId);
  if (!projectId) return integrationError(res, 404, "NOT_FOUND", "Project not found");

  const [environmentRows, variables, quotas] = await Promise.all([
    prisma.projectIntegrationEnvironment.findMany({
      where: { integration: { projectId } },
      include: { integration: { select: { provider: true } } },
    }),
    prisma.projectEnvironmentVariable.findMany({
      where: { projectId, environment: { in: ["development", "preview", "production"] } },
      select: { environment: true, key: true },
    }),
    getIntegrationUsageSummary(projectId),
  ]);

  const configurations = environmentRows.map((row) => {
    const configuredFields = variables
      .filter((variable) => variable.environment === row.environment)
      .map((variable) => variable.key)
      .filter((key) => integrationFields(row.integration.provider).includes(key));
    const quota = quotas.find((item) => item.provider === row.integration.provider);
    const isQuotaExhausted = row.credentialMode === "APPWRITE_MANAGED" && quota?.remaining === 0;
    return {
      provider: row.integration.provider,
      credentialMode: row.credentialMode as CredentialMode,
      environment: row.environment as "development" | "preview" | "production",
      status: isQuotaExhausted ? "quota_exhausted" : row.status,
      configuredFields: [...new Set(configuredFields)].sort(),
      lastTestedAt: row.lastTestedAt?.toISOString() ?? null,
      lastError: row.lastError,
    };
  });

  const response = IntegrationCatalogResponseSchema.parse({
    catalog: INTEGRATION_CATALOG.map((entry) => ({
      ...entry,
      setupInstructions: entry.provider === "razorpay"
        ? [
            ...entry.setupInstructions,
            `Configure a Razorpay webhook for development at ${PUBLIC_API_URL}/v1/integrations/razorpay/webhooks/${projectId}/development`,
            `Configure the production webhook at ${PUBLIC_API_URL}/v1/integrations/razorpay/webhooks/${projectId}/production`,
          ]
        : entry.setupInstructions,
      canUseManagedCredentials: canUseManagedCredentials(entry.provider),
    })),
    configurations,
    quotas,
  });
  res.json(response);
});

function integrationFields(provider: string): string[] {
  return INTEGRATION_CATALOG.find((entry) => entry.provider === provider)?.fields.map((field) => field.key) ?? [];
}
