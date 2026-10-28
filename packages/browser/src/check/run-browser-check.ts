import { exploreApp, type ExploreReport } from "../explore";
import { VIEWPORTS, type Viewport } from "../findings";
import type { LiveViewOptions } from "../live";
import { listPageFiles, selectCheckRoutes, type SkippedRoute } from "../routes";
import { AppServerError, startAppServer } from "../server";
import { BrowserUnavailableError, launchPlaywrightSession, type BrowserSession } from "../session";
import { classifyChange, isCopyOnlyChange, viewportsForRisk, type ChangeRisk, type ChangeScope } from "./classify-change";

export type BrowserCheckResult =
  | {
      readonly status: "checked";
      readonly report: ExploreReport;
      readonly skippedRoutes: readonly SkippedRoute[];
      readonly risk: ChangeRisk;
      readonly viewports: readonly string[];
    }
  | { readonly status: "skipped"; readonly reason: string }
  | { readonly status: "app-failed"; readonly reason: string };

export interface BrowserLiveView extends LiveViewOptions {
  readonly onActivity: (label: string) => void;
}

export interface BrowserRecheck {
  readonly routes: readonly string[];
  readonly viewports: readonly string[];
}

export interface BrowserCheckOptions {
  readonly workspaceDir: string;
  readonly outputDir: string;
  readonly launchSession?: () => Promise<BrowserSession>;
  readonly live?: BrowserLiveView;
  readonly scope?: ChangeScope;
  readonly recheck?: BrowserRecheck;
}

interface CheckPlan {
  readonly routes: readonly string[];
  readonly skipped: readonly SkippedRoute[];
  readonly risk: ChangeRisk;
  readonly viewports: readonly Viewport[];
}

function planCheck(pageFiles: readonly string[], options: BrowserCheckOptions): CheckPlan | { readonly reason: string } {
  if (options.recheck) {
    const wanted = new Set(options.recheck.viewports);
    const viewports = VIEWPORTS.filter((viewport) => wanted.has(viewport.name));
    return { routes: options.recheck.routes, skipped: [], risk: "visual", viewports };
  }
  const risk = options.scope ? classifyChange(options.scope) : "page";
  if (risk === "none") {
    return { reason: options.scope && isCopyOnlyChange(options.scope) ? "This prompt only changed words, by a similar length, so the layout was not rechecked" : "This prompt changed no page or UI file" };
  }
  const { routes, skipped, scoped } = selectCheckRoutes(pageFiles, options.scope?.changedPaths);
  if (routes.length === 0) {
    return { reason: scoped ? "This prompt didn't change a page to open" : "The app has no pages to open" };
  }
  return { routes, skipped, risk, viewports: viewportsForRisk(risk) };
}

export async function runBrowserCheck(options: BrowserCheckOptions): Promise<BrowserCheckResult> {
  const { workspaceDir, outputDir, launchSession = () => launchPlaywrightSession(options.live ? { live: options.live } : {}) } = options;
  const plan = planCheck(await listPageFiles(workspaceDir), options);
  if ("reason" in plan) return { status: "skipped", reason: plan.reason };

  let session: BrowserSession;
  try {
    session = await launchSession();
  } catch (error) {
    if (error instanceof BrowserUnavailableError) return { status: "skipped", reason: error.message };
    throw error;
  }

  try {
    const server = await startAppServer(workspaceDir);
    try {
      const report = await exploreApp({
        baseUrl: server.baseUrl,
        routes: plan.routes,
        session,
        outputDir,
        onActivity: options.live?.onActivity,
        viewports: plan.viewports,
        captureAll: plan.risk === "page",
      });
      const viewports = plan.viewports.map((viewport) => viewport.name);
      return { status: "checked", report, skippedRoutes: plan.skipped, risk: plan.risk, viewports };
    } finally {
      await server.stop();
    }
  } catch (error) {
    if (error instanceof AppServerError) return { status: "app-failed", reason: error.message };
    throw error;
  } finally {
    await session.close();
  }
}
