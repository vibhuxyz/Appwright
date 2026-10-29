import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { OpenAiProvider } from "@repo/agent-core";
import { MeteredProvider, SpendLedger } from "../budget";
import { SITE_BRIEFS } from "../briefs";
import { MAX_GENERATION_COST_USD, MAX_TOTAL_COST_USD } from "../constants";
import { GROUP_CONFIGS, pilotLimitations } from "../groups";
import { planSite, SitePlanError } from "../plan";
import type { ArtDirection, RepairMode, SiteGroup } from "../types";
import { assertIsolatedDatabase, requireSiteModel } from "./guards";
import { runGeneration } from "./run-generation";
import type { GenerationResult } from "./result-types";

const MAX_CONSECUTIVE_FAILURES = 2;

export interface MatrixOptions {
  readonly runId: string;
  readonly briefs: readonly ArtDirection[];
  readonly groups: readonly SiteGroup[];
  readonly templatesRoot: string;
  readonly resultsRoot: string;
  readonly repair: RepairMode;
}

export interface MatrixSummary {
  readonly runId: string;
  readonly stoppedEarly: string | null;
  readonly totalCostUsd: number;
  readonly repair: RepairMode;
  readonly results: readonly { label: string; status: string; costUsd: number; durationMs: number; repairRounds: number; failure: string | undefined }[];
}

function isFailure(result: GenerationResult): boolean {
  return result.status === "failed";
}

export async function runMatrix(options: MatrixOptions): Promise<MatrixSummary> {
  assertIsolatedDatabase(process.env);
  const model = requireSiteModel(process.env);
  const ledger = new SpendLedger({ generationUsd: MAX_GENERATION_COST_USD, totalUsd: MAX_TOTAL_COST_USD });
  const outputDir = path.join(options.resultsRoot, options.runId);
  const workspacesRoot = await mkdtemp(path.join(tmpdir(), "appwright-site-"));
  process.env.WORKSPACE_ROOT = workspacesRoot;
  await mkdir(outputDir, { recursive: true });
  const planner = new MeteredProvider(new OpenAiProvider({ model }), ledger);
  const briefs = SITE_BRIEFS.filter((brief) => options.briefs.includes(brief.id));
  const plans = new Map<ArtDirection, Awaited<ReturnType<typeof planSite>>["plan"]>();
  const ineligible: ArtDirection[] = [];
  for (const brief of briefs) {
    ledger.beginGeneration(`plan-${brief.id}`);
    const planned = await planSite(brief, { provider: planner, fixturesDir: path.join(options.resultsRoot, "fixtures") });
    plans.set(brief.id, planned.plan);
    if (!planned.isSinglePass) ineligible.push(brief.id);
  }
  if (ineligible.length > 0 && options.groups.some((group) => GROUP_CONFIGS[group].pipeline === "single-pass")) {
    throw new SitePlanError(`Blueprint(s) not single-pass eligible, so groups B and C cannot run them: ${ineligible.join(", ")} (see fixtures)`);
  }
  const results: GenerationResult[] = [];
  let stoppedEarly: string | null = null;
  let consecutiveFailures = 0;
  for (const brief of briefs) {
    const plan = plans.get(brief.id);
    for (const group of options.groups) {
      if (!plan || stoppedEarly) break;
      const result = await runGeneration({ runId: options.runId, model, group, brief, plan, ledger, outputDir, templatesRoot: options.templatesRoot, workspacesRoot, signal: new AbortController().signal, repair: options.repair });
      results.push(result);
      consecutiveFailures = isFailure(result) ? consecutiveFailures + 1 : 0;
      if (ledger.totalSpentUsd() >= MAX_TOTAL_COST_USD) stoppedEarly = "total cost cap reached";
      else if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) stoppedEarly = `${MAX_CONSECUTIVE_FAILURES} generations failed in a row`;
    }
  }
  const summary: MatrixSummary = {
    runId: options.runId,
    repair: options.repair,
    stoppedEarly,
    totalCostUsd: ledger.totalSpentUsd(),
    results: results.map((result) => ({ label: result.label, status: result.status, costUsd: result.costUsd, durationMs: result.durationMs, repairRounds: result.path.repairRounds, failure: result.failure?.message })),
  };
  const experiment = { summary, groups: GROUP_CONFIGS, limitations: pilotLimitations(options.repair), model, caps: { generationUsd: MAX_GENERATION_COST_USD, totalUsd: MAX_TOTAL_COST_USD }, spend: ledger.entries() };
  await writeFile(path.join(outputDir, "summary.json"), `${JSON.stringify(experiment, null, 2)}\n`, "utf8");
  return summary;
}
