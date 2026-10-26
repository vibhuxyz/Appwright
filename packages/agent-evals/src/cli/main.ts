import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { OpenAiProvider } from "@repo/agent-core";
import { ALL_CASES } from "../cases";
import { RESULTS_DIR } from "../core/constants";
import type { EvalCase, TrialResult } from "../core/types";
import { formatReport, overallPassRate, summarize } from "../report";
import { runTrial } from "../runner";
import { parseArgs } from "./parse-args";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const PACKAGE_ROOT = path.resolve(REPO_ROOT, "packages/agent-evals");

function selectCases(caseIds: readonly string[], tag: string | undefined): EvalCase[] {
  const unknown = caseIds.filter((id) => !ALL_CASES.some((c) => c.id === id));
  if (unknown.length > 0) throw new Error(`Unknown eval case: ${unknown.join(", ")}`);
  return ALL_CASES.filter(
    (c) => (caseIds.length === 0 || caseIds.includes(c.id)) && (!tag || c.tags.includes(tag)),
  );
}

async function main(): Promise<number> {
  const options = parseArgs(process.argv.slice(2), process.env);
  const cases = selectCases(options.caseIds, options.tag);
  if (cases.length === 0) throw new Error("No eval cases selected");

  const workspacesRoot = await mkdtemp(path.join(tmpdir(), "appwright-evals-"));
  process.env.WORKSPACE_ROOT = workspacesRoot;
  const provider = new OpenAiProvider({ model: options.model });

  const results: TrialResult[] = [];
  for (const evalCase of cases) {
    for (let trial = 1; trial <= options.trials; trial++) {
      results.push(
        await runTrial({
          evalCase,
          trial,
          provider,
          templatesRoot: path.join(REPO_ROOT, "templates"),
          workspacesRoot,
          now: Date.now,
        }),
      );
    }
  }

  const summaries = summarize(results);
  console.log(formatReport(summaries));

  const resultsDir = path.join(PACKAGE_ROOT, RESULTS_DIR);
  await mkdir(resultsDir, { recursive: true });
  const reportPath = path.join(resultsDir, `${new Date().toISOString().replaceAll(":", "-")}.json`);
  await writeFile(reportPath, JSON.stringify({ model: options.model, results }, null, 2));
  console.log(`report: ${reportPath}`);

  return overallPassRate(summaries) >= options.minPassRate ? 0 : 1;
}

process.exit(await main());
