import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { reviewScreenshots, type ReviewResult } from "@repo/agent-core";
import { launchPlaywrightSession, runBrowserCheck, type PageShot } from "@repo/browser";
import { buildShowcase } from "./build-showcase";
import { DESIGN_CASES, type DesignCase } from "./cases";
import { compareWithBaseline, type BaselineResult } from "./compare-baseline";
import { gradeCase, type CaseGrade } from "./grade-case";
import { runInteractionChecks } from "./interaction-checks";
import type { InteractionResult } from "./interaction-types";

const BASELINES_DIR = path.resolve(import.meta.dir, "../../baselines");
const PRERENDERED_DIR = ".next/server/app";

export interface DesignEvalOptions {
  readonly updateBaselines: boolean;
  readonly vision: boolean;
}

export interface DesignEvalCaseResult {
  readonly grade: CaseGrade;
  readonly baselines: readonly (BaselineResult & { readonly viewport: string })[];
  readonly review?: ReviewResult;
}

export interface DesignEvalResult {
  readonly workspaceDir: string;
  readonly cases: readonly DesignEvalCaseResult[];
}

async function prerenderedHtml(workspaceDir: string, route: string): Promise<string> {
  return readFile(path.join(workspaceDir, PRERENDERED_DIR, `${route.slice(1)}.html`), "utf8");
}

async function evaluateCase(
  designCase: DesignCase,
  context: {
    workspaceDir: string;
    outputDir: string;
    shots: readonly PageShot[];
    findings: Parameters<typeof gradeCase>[2];
    interactions: ReadonlyMap<string, readonly InteractionResult[]>;
  },
  options: DesignEvalOptions,
): Promise<DesignEvalCaseResult> {
  const html = await prerenderedHtml(context.workspaceDir, designCase.route);
  const grade = gradeCase(designCase, html, context.findings, context.interactions.get(designCase.id) ?? []);
  const shots = context.shots.filter((shot) => shot.route === designCase.route);
  const baselines = await Promise.all(
    shots.map(async (shot) => ({
      viewport: shot.viewport,
      ...(await compareWithBaseline(path.join(context.outputDir, shot.file), path.join(BASELINES_DIR, designCase.id, `${shot.viewport}.png`), {
        update: options.updateBaselines,
      })),
    })),
  );
  if (!options.vision) return { grade, baselines };
  const reviewShots = await Promise.all(
    shots
      .filter((shot) => shot.viewport !== "tablet")
      .map(async (shot) => ({
        route: shot.route,
        viewport: shot.viewport,
        png: new Uint8Array(await readFile(path.join(context.outputDir, shot.file))),
      })),
  );
  return { grade, baselines, review: await reviewScreenshots({ shots: reviewShots }) };
}

export async function runDesignEval(options: DesignEvalOptions): Promise<DesignEvalResult> {
  const workspaceDir = await mkdtemp(path.join(tmpdir(), "design-eval-"));
  const outputDir = path.join(workspaceDir, ".browser-report");
  await buildShowcase(workspaceDir, DESIGN_CASES);
  const check = await runBrowserCheck({
    workspaceDir,
    outputDir,
    launchSession: () => launchPlaywrightSession({ reducedMotion: "reduce" }),
  });
  if (check.status !== "checked") throw new Error(`Browser check did not run: ${check.reason}`);
  const interactions = await runInteractionChecks(workspaceDir, DESIGN_CASES);
  const context = { workspaceDir, outputDir, shots: check.report.pageShots, findings: check.report.findings, interactions };
  const cases: DesignEvalCaseResult[] = [];
  for (const designCase of DESIGN_CASES) cases.push(await evaluateCase(designCase, context, options));
  return { workspaceDir, cases };
}
