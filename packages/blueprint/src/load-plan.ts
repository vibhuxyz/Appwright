import { prisma } from "@repo/db";
import {
  DEFAULT_DESIGN_BLOCK,
  DEFAULT_LAYOUT_BLOCK,
  DEFAULT_RESPONSIVE_BLOCK,
  type Blueprint,
} from "@repo/contracts";
import { validateTaskGraph, type Plan, type TaskSpec } from "@repo/planner";
import { mapTaskRow } from "./map-task-row";

export async function loadPlanForRun(runId: string): Promise<Plan | undefined> {
  const run = await prisma.run.findUnique({
    where: { id: runId },
    select: { sessionId: true, blueprintVersion: true },
  });
  if (!run) return undefined;

  const row = await prisma.blueprint.findUnique({
    where: { sessionId_blueprintVersion: { sessionId: run.sessionId, blueprintVersion: run.blueprintVersion } },
    include: { tasks: true },
  });
  if (!row) return undefined;

  const blueprint: Blueprint = {
    blueprintVersion: row.blueprintVersion,
    intent: row.intent as Blueprint["intent"],
    stack: row.stack as Blueprint["stack"],
    entities: row.entities as Blueprint["entities"],
    pages: row.pages as Blueprint["pages"],
    features: row.features as Blueprint["features"],
    theme: row.theme as Blueprint["theme"],
    design: (row.design as Blueprint["design"] | null) ?? DEFAULT_DESIGN_BLOCK,
    layout: (row.layout as Blueprint["layout"] | null) ?? DEFAULT_LAYOUT_BLOCK,
    responsive: (row.responsive as Blueprint["responsive"] | null) ?? DEFAULT_RESPONSIVE_BLOCK,
  };

  const tasks: TaskSpec[] = row.tasks.map((task) => {
    const mapped = mapTaskRow(task);
    return {
      id: mapped.id,
      type: mapped.type,
      title: mapped.title,
      owns: mapped.owns,
      reads: mapped.reads,
      riskTier: mapped.riskTier,
      capability: mapped.capability,
      verification: task.verification as TaskSpec["verification"],
    };
  });

  const graph = validateTaskGraph(tasks);
  if (!graph.ok) return undefined;

  return { blueprint, tasks, graph: graph.value };
}
