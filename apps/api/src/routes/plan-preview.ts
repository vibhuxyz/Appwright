import { OpenAiProvider, plannerModel } from "@repo/agent-core";
import { PlanPreviewRequest } from "@repo/contracts";
import { prisma } from "@repo/db";
import { Router } from "express";
import { log } from "../log";
import { ownedSessionProjectId } from "../ownership";
import { createPlanPreview, planFailure } from "../plan-preview";
import { conversationRateLimitOk } from "../workflow/rate-limit";

export const planPreviewRouter = Router();

function requestIdOf(res: { getHeader(name: string): unknown }): string {
  const value = res.getHeader("x-request-id");
  return typeof value === "string" ? value : "";
}

function failure(res: { getHeader(name: string): unknown }, code: string, message: string) {
  return { error: { code, message, details: {}, requestId: requestIdOf(res) } };
}

planPreviewRouter.post("/v1/sessions/:sessionId/plan-previews", async (req, res) => {
  if (!(await ownedSessionProjectId(req.params.sessionId, req.userId!))) {
    return res.status(404).json(failure(res, "NOT_FOUND", "session not found"));
  }
  const parsed = PlanPreviewRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(failure(res, "INVALID_REQUEST", "A prompt is required to plan the app"));
  }
  if (!(await conversationRateLimitOk(req.userId!))) {
    return res.status(429).json(failure(res, "TOO_MANY_REQUESTS", "Too many requests. Slow down and try again shortly."));
  }
  const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { credits: true, plan: true } });
  if (!user || user.credits <= 0) {
    return res.status(402).json(failure(res, "OUT_OF_CREDITS", "Out of credits"));
  }

  try {
    const provider = new OpenAiProvider({ model: plannerModel(user.plan) });
    res.status(201).json(await createPlanPreview(req.params.sessionId, parsed.data, provider));
  } catch (error) {
    const result = planFailure(error);
    log.error("plan preview failed", {
      code: result.code,
      sessionId: req.params.sessionId,
      providerCreditsDepleted: result.isProviderCreditsDepleted,
      message: error instanceof Error ? error.message : String(error),
    });
    res.status(result.status).json(failure(res, result.code, result.message));
  }
});
