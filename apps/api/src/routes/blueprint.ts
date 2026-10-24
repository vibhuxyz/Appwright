import { access, readdir } from "node:fs/promises";
import path from "node:path";
import { LocalRuntime, OpenAiProvider, plannerModel, resolveModelForPlan } from "@repo/agent-core";
import {
  activeBlueprintRuns,
  buildBlueprint,
  executeBlueprintRun,
  persistBlueprint,
  startBlueprintRun,
} from "@repo/blueprint";
import { BuildBlueprintRequest, BuildBlueprintResponse, creditsToCents, creditsToUsd } from "@repo/contracts";
import { prisma } from "@repo/db";
import { tasksAlreadySatisfied, validateTaskGraph, type Plan } from "@repo/planner";
import { Router } from "express";
import { createAssetRequest, waitUntilAssetRequestResolved } from "../assets";
import { log } from "../log";
import { ownedSessionWorktree } from "../ownership";
import { planFailure } from "../plan-preview";
import { publishAssetRequest } from "../stream/sse";
import { conversationRateLimitOk } from "../workflow/rate-limit";
import { isWorktreeBusy, WORKTREE_BUSY_MESSAGE } from "../workflow/run-limit";
import { applyComposition, planComposition } from "@repo/workspace";
import { createSessionWorktree } from "../workspace/manager";

function isNotFound(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

async function pathSatisfied(worktreeDir: string, relPath: string): Promise<boolean> {
  if (relPath.startsWith("env:")) return false;
  if (relPath.endsWith("/**")) {
    const dir = path.join(worktreeDir, relPath.slice(0, -3));
    try {
      return (await readdir(dir)).length > 0;
    } catch (error) {
      if (isNotFound(error)) return false;
      throw error;
    }
  }
  return access(path.join(worktreeDir, relPath))
    .then(() => true)
    .catch((error: unknown) => {
      if (isNotFound(error)) return false;
      throw error;
    });
}

async function dropAlreadySatisfiedTasks(plan: Plan, worktreeDir: string): Promise<Plan> {
  const ownedPaths = [...new Set(plan.tasks.flatMap((task) => task.owns))];
  const checks = await Promise.all(
    ownedPaths.map(async (relPath) => [relPath, await pathSatisfied(worktreeDir, relPath)] as const),
  );
  const existingPaths = new Set(checks.filter(([, satisfied]) => satisfied).map(([relPath]) => relPath));
  const redundantIds = new Set(tasksAlreadySatisfied(plan.tasks, existingPaths));
  if (redundantIds.size === 0) return plan;

  const tasks = plan.tasks.filter((task) => !redundantIds.has(task.id));
  const graph = validateTaskGraph(tasks);
  if (!graph.ok) return plan;

  return {
    ...plan,
    tasks,
    graph: graph.value,
    reuseReport: plan.reuseReport.map((entry) =>
      redundantIds.has(entry.taskId) ? { ...entry, action: "reuse" as const } : entry,
    ),
  };
}

export const blueprintRouter = Router();

function requestIdOf(res: { getHeader(name: string): unknown }): string {
  const value = res.getHeader("x-request-id");
  return typeof value === "string" ? value : "";
}


blueprintRouter.post("/sessions/:sessionId/blueprint", async (req, res) => {
  const owned = await ownedSessionWorktree(req.params.sessionId, req.userId!);
  if (!owned) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "session not found", details: {}, requestId: requestIdOf(res) },
    });
  }
  const { projectId, worktreeSessionId } = owned;

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

  if (await isWorktreeBusy(worktreeSessionId, req.params.sessionId)) {
    return res.status(409).json({
      error: {
        code: "WORKTREE_BUSY",
        message: WORKTREE_BUSY_MESSAGE,
        details: {},
        requestId: requestIdOf(res),
      },
    });
  }

  const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { credits: true, plan: true } });
  if (!user || user.credits <= 0) {
    return res.status(402).json({
      error: { code: "OUT_OF_CREDITS", message: "Out of credits", details: {}, requestId: requestIdOf(res) },
    });
  }

  try {
    const session = await prisma.session.findUniqueOrThrow({
      where: { id: req.params.sessionId },
      select: { model: true },
    });
    const builtPlan = await buildBlueprint(parsed.data.prompt, {
      directionId: parsed.data.directionId,
      provider: new OpenAiProvider({ model: plannerModel(user.plan) }),
    });

    const worktreeDir = await createSessionWorktree(
      projectId,
      worktreeSessionId,
    );
    const plan = await dropAlreadySatisfiedTasks(builtPlan, worktreeDir);

    const reuseCounts = plan.reuseReport.reduce<Record<string, number>>((counts, entry) => {
      counts[entry.action] = (counts[entry.action] ?? 0) + 1;
      return counts;
    }, {});
    log.info("blueprint reuse analysis", {
      sessionId: req.params.sessionId,
      reuseCounts,
      tasksDropped: builtPlan.tasks.length - plan.tasks.length,
    });

    const persisted = await persistBlueprint(req.params.sessionId, plan);
    const runId = await startBlueprintRun({
      sessionId: req.params.sessionId,
      blueprintVersion: persisted.blueprintVersion,
      budgetUsd: creditsToUsd(user.credits),
    });

    const composePlan = planComposition({
      primaryHex: plan.blueprint.theme.primary,
      capabilityChoices: plan.blueprint.features,
    });
    await applyComposition(worktreeDir, composePlan);

    const assetRequest = await createAssetRequest(
      req.params.sessionId,
      projectId,
      persisted.blueprintId,
      plan.blueprint,
    );
    if (assetRequest) publishAssetRequest(req.params.sessionId, assetRequest);
    const assetRequestId = assetRequest?.id ?? null;

    const controller = new AbortController();
    activeBlueprintRuns.set(runId, controller);
    const sessionId = req.params.sessionId;
    void (async () => {
      if (assetRequest && assetRequest.status !== "RESOLVED") {
        await waitUntilAssetRequestResolved(assetRequest.id, controller.signal);
      }
      await executeBlueprintRun(
        {
          runId,
          sessionId,
          worktreeSessionId,
          projectId,
          model: resolveModelForPlan(user.plan, session.model),
          plan: user.plan,
          userRemainingCents: creditsToCents(user.credits),
          runtime: new LocalRuntime(projectId, worktreeSessionId),
        },
        controller.signal,
      );
    })()
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        log.error("blueprint run failed", {
          runId,
          sessionId,
          err: error instanceof Error ? error.message : String(error),
        });
      })
      .finally(() => {
        activeBlueprintRuns.delete(runId);
      });

    res.status(202).json(BuildBlueprintResponse.parse({ ...persisted, runId, assetRequestId }));
  } catch (error) {
    const result = planFailure(error);
    log.error("build blueprint failed", {
      code: result.code,
      sessionId: req.params.sessionId,
      providerCreditsDepleted: result.isProviderCreditsDepleted,
      message: error instanceof Error ? error.message : String(error),
    });
    res.status(result.status).json({
      error: { code: result.code, message: result.message, details: {}, requestId: requestIdOf(res) },
    });
  }
});
