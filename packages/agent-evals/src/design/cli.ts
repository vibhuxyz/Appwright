import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { formatDesignReport } from "./format-design-report";
import { runDesignEval } from "./run-design-eval";

const RESULTS_DIR = path.resolve(import.meta.dir, "../../results");

const options = {
  updateBaselines: process.argv.includes("--update-baselines"),
  vision: process.argv.includes("--vision"),
};
const result = await runDesignEval(options);
await mkdir(RESULTS_DIR, { recursive: true });
const file = path.join(RESULTS_DIR, `design-${new Date().toISOString().replaceAll(":", "-")}.json`);
await writeFile(file, `${JSON.stringify(result, null, 2)}\n`, "utf8");
process.stdout.write(`${formatDesignReport(result)}\nResults: ${file}\n`);
if (result.cases.some((entry) => !entry.grade.passed)) process.exitCode = 1;
