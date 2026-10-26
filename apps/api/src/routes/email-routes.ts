import {
  SendTestEmailRequest,
  SendTestEmailResponse,
  SetEmailProviderRequest,
} from "@repo/contracts";
import {
  sendProjectEmail,
  setActiveEmailProvider,
  setProjectEnvironmentVariable,
} from "@repo/db";
import { Router, type Response } from "express";
import { log } from "../log";
import { ownedProjectId } from "../ownership";

export const emailRouter = Router();

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

emailRouter.post("/v1/projects/:id/environment/email-provider", async (req, res) => {
  const projectId = await ownedProjectId(req.params.id, req.userId!);
  if (!projectId) {
    return errorResponse(res, 404, "NOT_FOUND", "Project not found");
  }

  const parsed = SetEmailProviderRequest.safeParse(req.body);
  if (!parsed.success) {
    return errorResponse(res, 400, "INVALID_INPUT", "Invalid email provider payload", {
      issues: parsed.error.issues,
    });
  }

  try {
    await setActiveEmailProvider({
      projectId,
      environment: parsed.data.environment,
      provider: parsed.data.provider,
    });

    if (parsed.data.config) {
      for (const [key, value] of Object.entries(parsed.data.config)) {
        if (!value) continue;
        const isSecret = key.includes("KEY") || key.includes("PASSWORD") || key.includes("SECRET");
        await setProjectEnvironmentVariable({
          projectId,
          environment: parsed.data.environment,
          key,
          value,
          isSecret,
        });
      }
    }

    res.json({ ok: true, activeProvider: parsed.data.provider });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error("Failed to set active email provider", { projectId, err: msg });
    errorResponse(res, 500, "INTERNAL_ERROR", "Could not set email provider");
  }
});

emailRouter.post("/v1/projects/:id/environment/send-test-email", async (req, res) => {
  const projectId = await ownedProjectId(req.params.id, req.userId!);
  if (!projectId) {
    return errorResponse(res, 404, "NOT_FOUND", "Project not found");
  }

  const parsed = SendTestEmailRequest.safeParse(req.body);
  if (!parsed.success) {
    return errorResponse(res, 400, "INVALID_INPUT", "Invalid test email request", {
      issues: parsed.error.issues,
    });
  }

  try {
    const result = await sendProjectEmail({
      projectId,
      environment: parsed.data.environment,
      to: parsed.data.to,
      subject: parsed.data.subject,
      text: parsed.data.text ?? "This is a test email sent from Appwright to verify your email provider configuration.",
      html: parsed.data.html ?? "<p>This is a test email sent from <strong>Appwright</strong> to verify your email provider configuration.</p>",
    });

    const responsePayload = SendTestEmailResponse.parse({
      ok: result.ok,
      provider: "email",
      messageId: result.messageId,
      message: result.ok
        ? `Test email sent successfully to ${parsed.data.to}`
        : `Email delivery failed: ${result.error}`,
      error: result.error,
    });

    res.status(result.ok ? 200 : 422).json(responsePayload);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error("Send test email error", { projectId, err: msg });
    res.status(500).json({
      ok: false,
      provider: "email",
      message: "Unexpected error sending test email",
      error: msg,
    });
  }
});
