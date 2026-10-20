import { LocalRuntime } from "@repo/agent-core";
import {
  activeBlueprintRuns,
  buildBlueprint,
  BuildBlueprintError,
  executeBlueprintRun,
  persistBlueprint,
  startBlueprintRun,
} from "@repo/blueprint";
import { BuildBlueprintRequest, BuildBlueprintResponse } from "@repo/contracts";
import { prisma } from "@repo/db";
import { Router } from "express";
import { createAssetRequest } from "../assets";
import { log } from "../log";
import { ownedSessionProjectId } from "../ownership";
import { publishAssetRequest } from "../stream/sse";
import { conversationRateLimitOk } from "../workflow/rate-limit";
import { applyComposition, planComposition } from "@repo/workspace";
import { createSessionWorktree } from "../workspace/manager";

export const blueprintRouter = Router();

function requestIdOf(res: { getHeader(name: string): unknown }): string {
  const value = res.getHeader("x-request-id");
  return typeof value === "string" ? value : "";
}

const STATUS_BY_CODE: Record<BuildBlueprintError["code"], number> = {
  INTENT_FAILED: 422,
  CONTENT_FAILED: 503,
  PLAN_INVALID: 422,
  TIMEOUT: 503,
};

blueprintRouter.post("/sessions/:sessionId/blueprint", async (req, res) => {
  const projectId = await ownedSessionProjectId(req.params.sessionId, req.userId!);
  if (!projectId) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "session not found", details: {}, requestId: requestIdOf(res) },
    });
  }

  const parsed = BuildBlueprintRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: { code: "INVALID_REQUEST", message: "Prompt is required", details: {}, requestId: requestIdOf(res) },
    });
  }

  if (!(await conversationRateLimitOk(req.userId!))) {
    return res.status(429).json({
      error: {
        code: "TOO_MANY_REQUESTS",
        message: "Too many requests. Slow down and try again shortly.",
        details: {},
        requestId: requestIdOf(res),
      },
    });
  }

  const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { credits: true } });
  if (!user || user.credits <= 0) {
    return res.status(402).json({
      error: { code: "OUT_OF_CREDITS", message: "Out of credits", details: {}, requestId: requestIdOf(res) },
    });
  }

  try {
    const plan = await buildBlueprint(parsed.data.prompt, { directionId: parsed.data.directionId });
    const persisted = await persistBlueprint(req.params.sessionId, plan);
    const runId = await startBlueprintRun(req.params.sessionId, persisted.blueprintVersion);

    const session = await prisma.session.findUniqueOrThrow({
      where: { id: req.params.sessionId },
      select: { model: true },
    });
    const worktreeDir = await createSessionWorktree(projectId, req.params.sessionId);
    const composePlan = planComposition({
      primaryHex: plan.blueprint.theme.primary,
      capabilityChoices: plan.blueprint.features,
    });
    await applyComposition(worktreeDir, composePlan);

    // Detecting image slots and asking the user about them never blocks the
    // Task Graph below — the agent writes pages that reference each slot's
    // final, predictable path, and the chat card resolves slots whenever the
    // user answers, independently of build progress.
    const assetRequest = await createAssetRequest(
      req.params.sessionId,
      persisted.blueprintId,
      plan.blueprint,
    );
    if (assetRequest) publishAssetRequest(req.params.sessionId, assetRequest);
    const assetRequestId = assetRequest?.id ?? null;

    const controller = new AbortController();
    activeBlueprintRuns.set(runId, controller);
    executeBlueprintRun(
      {
        runId,
        sessionId: req.params.sessionId,
        projectId,
        model: session.model,
        userRemainingCents: Number.POSITIVE_INFINITY,
        runtime: new LocalRuntime(projectId, req.params.sessionId),
      },
      controller.signal,
    )
      .catch((error: unknown) => {
        log.error("blueprint run failed", {
          runId,
          sessionId: req.params.sessionId,
          err: error instanceof Error ? error.message : String(error),
        });
      })
      .finally(() => {
        activeBlueprintRuns.delete(runId);
      });

    res.status(202).json(BuildBlueprintResponse.parse({ ...persisted, runId, assetRequestId }));
  } catch (error) {
    const code = error instanceof BuildBlueprintError ? error.code : "CONTENT_FAILED";
    log.error("build blueprint failed", { code, sessionId: req.params.sessionId });
    res.status(STATUS_BY_CODE[code]).json({
      error: {
        code,
        message: error instanceof Error ? error.message : "Could not plan the app",
        details: {},
        requestId: requestIdOf(res),
      },
    });
  }
});
