import { exploreApp, type ExploreReport } from "../explore";
import { VIEWPORTS } from "../findings";
import type { LiveViewOptions } from "../live";
import { listPageFiles, selectCheckRoutes, type SkippedRoute } from "../routes";
import { AppServerError, startAppServer } from "../server";
import { BrowserUnavailableError, launchPlaywrightSession, type BrowserSession } from "../session";

export type BrowserCheckResult =
  | { readonly status: "checked"; readonly report: ExploreReport; readonly skippedRoutes: readonly SkippedRoute[] }
  | { readonly status: "skipped"; readonly reason: string }
  | { readonly status: "app-failed"; readonly reason: string };

export interface BrowserLiveView extends LiveViewOptions {
  readonly onActivity: (label: string) => void;
}

export interface BrowserCheckOptions {
  readonly workspaceDir: string;
  readonly outputDir: string;
  readonly launchSession?: () => Promise<BrowserSession>;
  readonly live?: BrowserLiveView;
  readonly changedPaths?: readonly string[];
}

const DESKTOP_ONLY = VIEWPORTS.filter((viewport) => viewport.name === "desktop");

export async function runBrowserCheck(options: BrowserCheckOptions): Promise<BrowserCheckResult> {
  const { workspaceDir, outputDir, launchSession = () => launchPlaywrightSession(options.live) } = options;
  const pageFiles = await listPageFiles(workspaceDir);
  const { routes, skipped, scoped } = selectCheckRoutes(pageFiles, options.changedPaths);
  if (routes.length === 0) {
    const reason = scoped ? "This prompt didn't change a page to open" : "The app has no pages to open";
    return { status: "skipped", reason };
  }

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
        routes,
        session,
        outputDir,
        onActivity: options.live?.onActivity,
        viewports: scoped && DESKTOP_ONLY.length > 0 ? DESKTOP_ONLY : undefined,
      });
      return { status: "checked", report, skippedRoutes: skipped };
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
