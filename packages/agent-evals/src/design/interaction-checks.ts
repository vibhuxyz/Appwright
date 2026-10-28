import { chromium, type Browser, type Page } from "playwright-core";
import { startAppServer } from "@repo/browser";
import type { DesignCase } from "./cases";
import {
  checkCanvasMotion,
  checkContentAfterScroll,
  checkDragCard,
  checkImageCompareKeyboard,
  checkImageCompareLabels,
  checkTapTargets,
} from "./interaction-scripts";
import type { InteractionCheckId, InteractionResult } from "./interaction-types";

const DESKTOP = { width: 1440, height: 900 } as const;
const MOBILE = { width: 375, height: 812 } as const;
const NAVIGATION_TIMEOUT_MS = 30_000;

type ReducedMotion = "reduce" | "no-preference";

interface PageRun {
  readonly viewport: { readonly width: number; readonly height: number };
  readonly reducedMotion: ReducedMotion;
  readonly run: (page: Page) => Promise<InteractionResult>;
}

const RUNS: Readonly<Record<InteractionCheckId, readonly PageRun[]>> = {
  "drag-card": [{ viewport: DESKTOP, reducedMotion: "no-preference", run: checkDragCard }],
  "image-compare-keyboard": [{ viewport: DESKTOP, reducedMotion: "no-preference", run: checkImageCompareKeyboard }],
  "image-compare-labels": [
    { viewport: DESKTOP, reducedMotion: "no-preference", run: checkImageCompareLabels },
    { viewport: MOBILE, reducedMotion: "no-preference", run: checkImageCompareLabels },
  ],
  "canvas-reduced-motion": [
    { viewport: DESKTOP, reducedMotion: "reduce", run: (page) => checkCanvasMotion(page, true) },
    { viewport: DESKTOP, reducedMotion: "no-preference", run: (page) => checkCanvasMotion(page, false) },
  ],
  "content-after-scroll": [
    { viewport: DESKTOP, reducedMotion: "no-preference", run: checkContentAfterScroll },
    { viewport: MOBILE, reducedMotion: "reduce", run: checkContentAfterScroll },
  ],
  "mobile-tap-targets": [{ viewport: MOBILE, reducedMotion: "no-preference", run: checkTapTargets }],
};

async function runOnPage(browser: Browser, url: string, run: PageRun): Promise<InteractionResult> {
  const context = await browser.newContext({ viewport: run.viewport, reducedMotion: run.reducedMotion });
  try {
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: NAVIGATION_TIMEOUT_MS });
    return await run.run(page);
  } finally {
    await context.close();
  }
}

function merge(id: InteractionCheckId, results: readonly InteractionResult[]): InteractionResult {
  return { id, passed: results.every((entry) => entry.passed), detail: results.map((entry) => entry.detail).join(" | ") };
}

async function runCase(browser: Browser, baseUrl: string, designCase: DesignCase): Promise<InteractionResult[]> {
  const results: InteractionResult[] = [];
  for (const id of designCase.interactions) {
    const runs: InteractionResult[] = [];
    for (const run of RUNS[id]) runs.push(await runOnPage(browser, `${baseUrl}${designCase.route}`, run));
    results.push(merge(id, runs));
  }
  return results;
}

export async function runInteractionChecks(workspaceDir: string, cases: readonly DesignCase[]): Promise<ReadonlyMap<string, readonly InteractionResult[]>> {
  const server = await startAppServer(workspaceDir);
  const browser = await chromium.launch({ headless: true });
  try {
    const byCase = new Map<string, readonly InteractionResult[]>();
    for (const designCase of cases) byCase.set(designCase.id, await runCase(browser, server.baseUrl, designCase));
    return byCase;
  } finally {
    await browser.close();
    await server.stop();
  }
}
