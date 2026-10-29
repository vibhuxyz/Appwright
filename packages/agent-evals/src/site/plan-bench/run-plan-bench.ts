import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { OpenAiProvider } from "@repo/agent-core";
import { buildBlueprint, BuildBlueprintError } from "@repo/blueprint";
import { MeteredProvider, SpendLedger } from "../budget";
import { SITE_BRIEFS } from "../briefs";
import { MAX_GENERATION_COST_USD, MAX_TOTAL_COST_USD } from "../constants";
import { assertIsolatedDatabase, requireSiteModel } from "../run/guards";
import type { SiteBrief } from "../types";
import { percentile } from "./percentile";
import type { PlanBenchOptions, PlanBenchSample, PlanBenchSummary } from "./types";

const P50 = 0.5;
const P75 = 0.75;
const MAX_FAILURE_CHARS = 300;

async function sampleOnce(brief: SiteBrief, repeat: number, provider: MeteredProvider, ledger: SpendLedger): Promise<PlanBenchSample> {
  const label = `plan-${brief.id}-${repeat}`;
  ledger.beginGeneration(label);
  const startedAt = performance.now();
  const base = { briefId: brief.id, repeat };
  try {
    const plan = await buildBlueprint(brief.prompt, { provider });
    const durationMs = Math.round(performance.now() - startedAt);
    const costUsd = ledger.generationSpentUsd();
    return { ...base, durationMs, status: "ok", costUsd, pageCount: plan.blueprint.pages.length, taskCount: plan.tasks.length };
  } catch (error) {
    if (!(error instanceof BuildBlueprintError)) throw error;
    const durationMs = Math.round(performance.now() - startedAt);
    const failure = `${error.code}: ${error.message}`.slice(0, MAX_FAILURE_CHARS);
    return { ...base, durationMs, status: "failed", failure, costUsd: ledger.generationSpentUsd(), pageCount: 0, taskCount: 0 };
  }
}

function summarize(runId: string, model: string, samples: readonly PlanBenchSample[]): PlanBenchSummary {
  const okDurations = samples.filter((sample) => sample.status === "ok").map((sample) => sample.durationMs);
  return {
    runId,
    model,
    samples,
    okDurationsMs: { p50: percentile(okDurations, P50), p75: percentile(okDurations, P75), max: percentile(okDurations, 1) },
    failedCount: samples.length - okDurations.length,
    totalCostUsd: samples.reduce((sum, sample) => sum + sample.costUsd, 0),
  };
}

export async function runPlanBench(options: PlanBenchOptions): Promise<PlanBenchSummary> {
  assertIsolatedDatabase(process.env);
  const model = requireSiteModel(process.env);
  const ledger = new SpendLedger({ generationUsd: MAX_GENERATION_COST_USD, totalUsd: MAX_TOTAL_COST_USD });
  const provider = new MeteredProvider(new OpenAiProvider({ model }), ledger);
  const briefs = SITE_BRIEFS.filter((brief) => options.briefs.includes(brief.id));
  const samples: PlanBenchSample[] = [];
  for (let repeat = 0; repeat < options.repeats; repeat++) {
    for (const brief of briefs) samples.push(await sampleOnce(brief, repeat, provider, ledger));
  }
  const summary = summarize(options.runId, model, samples);
  const outputDir = path.join(options.resultsRoot, options.runId);
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, "plan-bench.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  return summary;
}
