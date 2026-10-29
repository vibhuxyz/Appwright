import path from "node:path";
import { fileURLToPath } from "node:url";
import { SITE_BRIEFS } from "./briefs";
import { RESULTS_SUBDIR } from "./constants";
import { runPlanBench } from "./plan-bench";
import { runMatrix, runSmoke } from "./run";
import type { ArtDirection, RepairMode, SiteGroup } from "./types";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const RESULTS_ROOT = path.join(REPO_ROOT, "packages/agent-evals/results", RESULTS_SUBDIR);
const TEMPLATES_ROOT = path.join(REPO_ROOT, "templates");
const ALL_GROUPS: readonly SiteGroup[] = ["A", "B", "C"];
const DEFAULT_PLAN_BENCH_REPEATS = 2;
const MAX_PLAN_BENCH_REPEATS = 5;

function listFlag(name: string): string[] | undefined {
  const arg = process.argv.find((entry) => entry.startsWith(`--${name}=`));
  return arg ? arg.slice(name.length + 3).split(",").filter(Boolean) : undefined;
}

function chosenGroups(): SiteGroup[] {
  const wanted = listFlag("groups") ?? [...ALL_GROUPS];
  const invalid = wanted.filter((group) => !ALL_GROUPS.includes(group as SiteGroup));
  if (invalid.length > 0) throw new Error(`Unknown group: ${invalid.join(", ")}`);
  return wanted as SiteGroup[];
}

function chosenBriefs(): ArtDirection[] {
  const known = SITE_BRIEFS.map((brief) => brief.id);
  const wanted = listFlag("briefs") ?? known;
  const invalid = wanted.filter((id) => !known.includes(id as ArtDirection));
  if (invalid.length > 0) throw new Error(`Unknown brief: ${invalid.join(", ")}`);
  return wanted as ArtDirection[];
}

function chosenRepair(): RepairMode {
  return process.argv.includes("--repair") ? "production" : "off";
}

if (process.argv.includes("--smoke")) {
  process.stdout.write(`${JSON.stringify(await runSmoke({ templatesRoot: TEMPLATES_ROOT, resultsRoot: RESULTS_ROOT }), null, 2)}\n`);
} else if (process.argv.includes("--plan-bench")) {
  if (!process.argv.includes("--confirm-spend")) throw new Error("--plan-bench spends provider money: add --confirm-spend");
  const runId = listFlag("run-id")?.[0] ?? `plan-bench-${new Date().toISOString().replaceAll(/[:.]/g, "-").toLowerCase()}`;
  const repeats = Number.parseInt(listFlag("repeats")?.[0] ?? `${DEFAULT_PLAN_BENCH_REPEATS}`, 10);
  if (!Number.isInteger(repeats) || repeats < 1 || repeats > MAX_PLAN_BENCH_REPEATS) throw new Error(`--repeats must be 1-${MAX_PLAN_BENCH_REPEATS}`);
  const summary = await runPlanBench({ runId, briefs: chosenBriefs(), repeats, resultsRoot: RESULTS_ROOT });
  process.stdout.write(`${JSON.stringify({ ...summary, samples: summary.samples.length }, null, 2)}\n`);
  if (summary.failedCount > 0) process.exitCode = 1;
} else if (process.argv.includes("--run")) {
  if (!process.argv.includes("--confirm-spend")) throw new Error("--run spends provider money: add --confirm-spend");
  const runId = listFlag("run-id")?.[0] ?? new Date().toISOString().replaceAll(/[:.]/g, "-").toLowerCase();
  const summary = await runMatrix({ runId, briefs: chosenBriefs(), groups: chosenGroups(), templatesRoot: TEMPLATES_ROOT, resultsRoot: RESULTS_ROOT, repair: chosenRepair() });
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (summary.stoppedEarly || summary.results.some((result) => result.status === "failed")) process.exitCode = 1;
} else {
  process.stdout.write("Usage: bun run eval:site --smoke | --run --confirm-spend [--groups=A,B,C] [--briefs=fashion,saas] [--run-id=x] [--repair] | --plan-bench --confirm-spend [--briefs=..] [--repeats=2]\n");
}
