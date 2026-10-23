import { bestModelForPlan, OpenAiProvider } from "@repo/agent-core";
import { ThemeOptionsRequest } from "@repo/contracts";
import { prisma } from "@repo/db";
import { Router } from "express";
import { generateThemeOptions } from "../themes";
import { conversationRateLimitOk } from "../workflow/rate-limit";

export const themeRouter = Router();

function requestIdOf(res: { getHeader(name: string): unknown }): string {
  const header = res.getHeader("x-request-id");
  return typeof header === "string" ? header : "";
}

function failure(res: { getHeader(name: string): unknown }, code: string, message: string) {
  return { error: { code, message, details: {}, requestId: requestIdOf(res) } };
}

themeRouter.post("/v1/theme-options", async (req, res) => {
  const parsed = ThemeOptionsRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(failure(res, "INVALID_REQUEST", "A prompt is required to design themes"));
  }
  if (!(await conversationRateLimitOk(req.userId!))) {
    return res.status(429).json(failure(res, "TOO_MANY_REQUESTS", "Too many requests. Slow down and try again shortly."));
  }
  const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { credits: true, plan: true } });
  if (!user || user.credits <= 0) {
    return res.status(402).json(failure(res, "OUT_OF_CREDITS", "Out of credits"));
  }
  const provider = new OpenAiProvider({ model: bestModelForPlan(user.plan) });
  res.json(await generateThemeOptions(parsed.data, provider));
});
