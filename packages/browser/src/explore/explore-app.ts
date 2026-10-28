import { VIEWPORTS, screenshotName, type Viewport } from "../findings";
import { interactWithPage, mergeInteractionResults, type InteractionResult } from "../interact";
import { browserActivityLabel, browserVisitLimit } from "../live";
import type { BrowserSession } from "../session";
import { mapWithConcurrency } from "../shared";
import { checkLinks } from "./check-links";
import type { ExploreOptions, ExploreReport, VisitResult } from "./types";
import { visitPage } from "./visit-page";

const INTERACTION_VIEWPORT_NAMES: ReadonlySet<string> = new Set(["mobile", "desktop"]);

interface Visit {
  readonly route: string;
  readonly viewport: Viewport;
}

interface WatchedVisit extends Visit {
  readonly baseUrl: string;
  readonly outputDir: string;
  readonly captureAll?: boolean;
  readonly onActivity?: (label: string) => void;
}

async function runVisit(session: BrowserSession, options: WatchedVisit): Promise<VisitResult> {
  const { onActivity, route, viewport, baseUrl, outputDir, captureAll } = options;
  onActivity?.(browserActivityLabel(route, viewport.name, "scrolling"));
  return visitPage(session, { baseUrl, outputDir, route, viewport, captureAll });
}

async function runInteraction(session: BrowserSession, options: WatchedVisit): Promise<InteractionResult> {
  const { onActivity, route, viewport, baseUrl, outputDir } = options;
  onActivity?.(browserActivityLabel(route, viewport.name, "interacting"));
  return interactWithPage(session, { baseUrl, outputDir, route, viewport });
}

function interactionVisits(visits: readonly Visit[]): Visit[] {
  return visits.filter((visit) => INTERACTION_VIEWPORT_NAMES.has(visit.viewport.name));
}

export async function exploreApp(options: ExploreOptions): Promise<ExploreReport> {
  const { baseUrl, routes, session, outputDir, interact = true, captureAll = false, onActivity } = options;
  const viewports = options.viewports ?? VIEWPORTS;
  const visits: Visit[] = routes.flatMap((route) => viewports.map((viewport) => ({ route, viewport })));
  const limit = browserVisitLimit(onActivity !== undefined);
  const watched = { baseUrl, outputDir, captureAll, onActivity };
  const results = await mapWithConcurrency(visits, limit, (visit) => runVisit(session, { ...watched, ...visit }));
  const interactions: InteractionResult = interact
    ? mergeInteractionResults(
        await mapWithConcurrency(interactionVisits(visits), limit, (visit) =>
          runInteraction(session, { ...watched, ...visit }),
        ),
      )
    : mergeInteractionResults([]);
  const linkFindings = await checkLinks(
    results.flatMap((result) => result.links),
    routes,
  );
  const visitScreenshots = visits
    .filter((_visit, index) => (results[index]?.findings.length ?? 0) > 0)
    .map((visit) => screenshotName(visit.route, visit.viewport));
  const pageShots = visits.flatMap((visit, index) => {
    const file = results[index]?.screenshot;
    return file ? [{ route: visit.route, viewport: visit.viewport.name, file }] : [];
  });
  return {
    routes,
    pagesChecked: visits.length,
    formsTested: interactions.formsTested,
    buttonsClicked: interactions.buttonsClicked,
    findings: [...results.flatMap((result) => result.findings), ...interactions.findings, ...linkFindings],
    screenshots: [...visitScreenshots, ...interactions.screenshots],
    pageShots,
    notes: interactions.notes,
  };
}
