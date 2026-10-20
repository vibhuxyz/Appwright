import { activeBlueprintRuns, loadPlanForRun, mapTaskRow, taskStatusFromPrisma } from "@repo/blueprint";
import { BlueprintSchema, DesignDirectionsResponse, LatestBlueprintRunResponse } from "@repo/contracts";
import { prisma } from "@repo/db";
import { generateDesignDirections, toPlanContract } from "@repo/planner";
import { Router } from "express";
import { ownedBlueprintSessionId, ownedRunSessionId, ownedSessionProjectId } from "../ownership";

export const planRouter = Router();

function notFound(res: { status(code: number): { json(body: unknown): void } }) {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "not found", details: {}, requestId: "" } });
}

// Slice 3b — "the design is reviewed before it is built" (D53). Pure and
// deterministic (no LLM, no DB), so it needs nothing but a prompt string
// and runs before any planning or generation starts.
planRouter.get("/v1/design-directions", (req, res) => {
  const prompt = typeof req.query.prompt === "string" ? req.query.prompt : "";
  res.json(DesignDirectionsResponse.parse({ directions: generateDesignDirections(prompt) }));
});

planRouter.get("/v1/blueprints/:blueprintId", async (req, res) => {
  if (!(await ownedBlueprintSessionId(req.params.blueprintId, req.userId!))) return notFound(res);
  const row = await prisma.blueprint.findUnique({ where: { id: req.params.blueprintId } });
  if (!row) return notFound(res);
  res.json(
    BlueprintSchema.parse({
      blueprintVersion: row.blueprintVersion,
      intent: row.intent,
      stack: row.stack,
      entities: row.entities,
      pages: row.pages,
      features: row.features,
      theme: row.theme,
      design: row.design ?? undefined,
      layout: row.layout ?? undefined,
      responsive: row.responsive ?? undefined,
    }),
  );
});

planRouter.get("/v1/runs/:runId", async (req, res) => {
  if (!(await ownedRunSessionId(req.params.runId, req.userId!))) return notFound(res);
  const run = await prisma.run.findUnique({
    where: { id: req.params.runId },
    select: { id: true, status: true, sessionId: true, blueprintVersion: true },
  });
  if (!run) return notFound(res);
  const blueprint = await prisma.blueprint.findUnique({
    where: { sessionId_blueprintVersion: { sessionId: run.sessionId, blueprintVersion: run.blueprintVersion } },
    include: { tasks: true },
  });
  res.json({
    id: run.id,
    status: run.status.toLowerCase(),
    tasks: (blueprint?.tasks ?? []).map(mapTaskRow),
  });
});

planRouter.get("/v1/runs/:runId/plan", async (req, res) => {
  if (!(await ownedRunSessionId(req.params.runId, req.userId!))) return notFound(res);
  const plan = await loadPlanForRun(req.params.runId);
  if (!plan) return notFound(res);
  res.json(toPlanContract(plan));
});

planRouter.get("/v1/runs/:runId/tasks/:taskId/attempts", async (req, res) => {
  if (!(await ownedRunSessionId(req.params.runId, req.userId!))) return notFound(res);
  const attempts = await prisma.taskAttempt.findMany({
    where: { runId: req.params.runId, taskId: req.params.taskId },
    orderBy: { attemptNumber: "asc" },
  });
  res.json({
    attempts: attempts.map((attempt) => ({
      id: attempt.id,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status.toLowerCase(),
      model: attempt.model,
      durationMs: attempt.durationMs,
      error: attempt.error,
      transcript: [],
    })),
  });
});

planRouter.post("/v1/runs/:runId/stop", async (req, res) => {
  if (!(await ownedRunSessionId(req.params.runId, req.userId!))) return notFound(res);
  const controller = activeBlueprintRuns.get(req.params.runId);
  if (controller) {
    controller.abort();
    activeBlueprintRuns.delete(req.params.runId);
  }
  res.json({ ok: true, stopped: Boolean(controller) });
});

planRouter.get("/v1/sessions/:sessionId/blueprint-run", async (req, res) => {
  if (!(await ownedSessionProjectId(req.params.sessionId, req.userId!))) return notFound(res);
  const run = await prisma.run.findFirst({
    where: { sessionId: req.params.sessionId },
    orderBy: { createdAt: "desc" },
    select: { id: true, sessionId: true, blueprintVersion: true },
  });
  if (!run) return res.json(null);
  const blueprint = await prisma.blueprint.findUnique({
    where: { sessionId_blueprintVersion: { sessionId: run.sessionId, blueprintVersion: run.blueprintVersion } },
    select: { id: true },
  });
  if (!blueprint) return res.json(null);
  res.json(LatestBlueprintRunResponse.parse({ blueprintId: blueprint.id, runId: run.id }));
});
