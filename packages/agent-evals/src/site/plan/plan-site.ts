import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Provider } from "@repo/agent-core";
import { buildBlueprint, isSinglePassBlueprint } from "@repo/blueprint";
import { BlueprintSchema } from "@repo/contracts";
import { planBlueprint, type Plan } from "@repo/planner";
import type { PlannedSite, SiteBrief } from "../types";

export class SitePlanError extends Error {}

function isNotFound(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

async function readCachedBlueprint(file: string): Promise<unknown | null> {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

export function planFromBlueprint(input: unknown, briefId: string): Plan {
  const planned = planBlueprint(BlueprintSchema.parse(input));
  if (!planned.ok) throw new SitePlanError(`Cannot plan ${briefId}: ${planned.issues.map((issue) => issue.message).join("; ")}`);
  return planned.value;
}

export async function planSite(
  brief: SiteBrief,
  options: { provider: Provider; fixturesDir: string },
): Promise<{ site: PlannedSite; plan: Plan; isCached: boolean; isSinglePass: boolean }> {
  const file = path.join(options.fixturesDir, `${brief.id}.blueprint.json`);
  const cached = await readCachedBlueprint(file);
  const plan = cached ? planFromBlueprint(cached, brief.id) : await buildBlueprint(brief.prompt, { provider: options.provider });
  if (!cached) {
    await mkdir(options.fixturesDir, { recursive: true });
    await writeFile(file, `${JSON.stringify(plan.blueprint, null, 2)}\n`, "utf8");
  }
  return { site: { briefId: brief.id, blueprint: plan.blueprint }, plan, isCached: cached !== null, isSinglePass: isSinglePassBlueprint(plan.blueprint) };
}
