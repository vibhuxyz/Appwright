import {
  IntegrationEnvironmentSchema,
  IntegrationProviderSchema,
} from "@repo/contracts";
import {
  runIntegrationTest,
  setActiveEmailProvider,
  setProjectEnvironmentVariable,
} from "@repo/db";
import { Router, type Response } from "express";
import { z } from "zod";
import { log } from "../log";
import { ownedProjectId } from "../ownership";
import { publishStatus } from "../stream/sse";
import { isReservedEnvironmentKey } from "./environment-security";

export const integrationCardRouter = Router();

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

function isSecretVariable(key: string): boolean {
  const upper = key.toUpperCase();
  return (
    upper.includes("KEY") ||
    upper.includes("SECRET") ||
    upper.includes("PASSWORD") ||
    upper.includes("TOKEN") ||
    upper.includes("URI")
  );
}

const SaveAndTestRequest = z.object({
  provider: IntegrationProviderSchema,
  environment: IntegrationEnvironmentSchema.default("development"),
  emailProvider: z.enum(["brevo", "nodemailer"]).optional(),
  variables: z.record(z.string(), z.string()),
  sessionId: z.string().optional(),
});

integrationCardRouter.post(
  "/v1/projects/:id/environment/save-and-test",
  async (req, res) => {
    if (!req.userId) return errorResponse(res, 401, "UNAUTHORIZED", "Authentication required");
    const actorUserId = req.userId;
    const projectId = await ownedProjectId(req.params.id, actorUserId);
    if (!projectId) {
      return errorResponse(res, 404, "NOT_FOUND", "Project not found");
    }

    const parsed = SaveAndTestRequest.safeParse(req.body);
    if (!parsed.success) {
      return errorResponse(res, 400, "INVALID_INPUT", "Invalid integration form submission", {
        issues: parsed.error.issues,
      });
    }

    const { provider, environment, emailProvider, variables, sessionId } = parsed.data;

    if (provider === "razorpay" || provider === "google-oauth") {
      return errorResponse(res, 422, "INTEGRATION_SETUP_REQUIRED", "Configure this provider from the shared Connectors flow");
    }
    if (Object.keys(variables).some(isReservedEnvironmentKey)) {
      return errorResponse(res, 422, "RESERVED_ENVIRONMENT_KEY", "Integration credentials must be managed from Connectors");
    }

    try {
      if (provider === "email" && emailProvider) {
        await setActiveEmailProvider({
          projectId,
          environment,
          provider: emailProvider,
        });

      }

      for (const [key, value] of Object.entries(variables)) {
        if (!value || !value.trim()) continue;
        await setProjectEnvironmentVariable({
          projectId,
          environment,
          key,
          value: value.trim(),
          isSecret: isSecretVariable(key),
        });
      }

      const testResult = await runIntegrationTest({
        projectId,
        actorUserId,
        provider,
        environment,
      });

      if (testResult.status === "connected" && sessionId) {
        publishStatus(sessionId, "RUNNING", `${provider} integration verified. Resuming workflow…`);
      }

      res.json({
        ok: testResult.status === "connected",
        provider,
        status: testResult.status,
        message: testResult.message,
        testedAt: testResult.testedAt,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error("Save and test failed", { projectId, provider, err: msg });
      res.status(500).json({
        ok: false,
        provider,
        status: "invalid",
        message: `Verification attempt failed: ${msg}`,
      });
    }
  },
);

