import { makeFinding, type Finding } from "../findings";
import type { NavigationResult, ObservedEvents, PageMeasurements } from "../session";

const MIN_BODY_TEXT_CHARS = 20;
const HTTP_ERROR_STATUS = 400;
const OVERFLOW_TOLERANCE_PX = 1;

export interface PageObservation {
  readonly route: string;
  readonly viewport: string;
  readonly pageUrl: string;
  readonly navigation: NavigationResult;
  readonly measurements: PageMeasurements;
  readonly events: ObservedEvents;
}

function pathOf(url: string): string {
  const parsed = new URL(url);
  return `${parsed.pathname}${parsed.search}`;
}

function eventFindings(observation: PageObservation): Finding[] {
  const where = { route: observation.route, viewport: observation.viewport };
  const { events, pageUrl } = observation;
  const seen = new Set<string>();
  const responses = events.badResponses
    .filter((response) => response.url !== pageUrl)
    .filter((response) => {
      const key = `${response.status} ${pathOf(response.url)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((response) =>
      makeFinding("http-error", where, `Request returned ${response.status}: ${pathOf(response.url)}`),
    );
  return [
    ...responses,
    ...events.pageErrors.map((message) => makeFinding("page-error", where, `Uncaught error: ${message}`)),
    ...events.consoleErrors.map((message) => makeFinding("console-error", where, `Console error: ${message}`)),
    ...events.failedRequests.map((message) => makeFinding("request-failed", where, `Request failed: ${message}`)),
  ];
}

function layoutFindings(observation: PageObservation): Finding[] {
  const where = { route: observation.route, viewport: observation.viewport };
  const { measurements, navigation } = observation;
  const findings: Finding[] = [];
  if (measurements.scrollWidth > measurements.viewportWidth + OVERFLOW_TOLERANCE_PX) {
    const culprits = measurements.overflowing.length > 0 ? ` Wide elements: ${measurements.overflowing.join("; ")}` : "";
    findings.push(
      makeFinding(
        "horizontal-overflow",
        where,
        `Page scrolls sideways: content is ${measurements.scrollWidth}px wide in a ${measurements.viewportWidth}px viewport.${culprits}`,
      ),
    );
  }
  if (measurements.brokenImages.length > 0) {
    findings.push(makeFinding("broken-image", where, `Images failed to load: ${measurements.brokenImages.join(", ")}`));
  }
  if (measurements.unlabelledControls.length > 0) {
    findings.push(
      makeFinding("unlabelled-control", where, `Controls with no accessible name: ${measurements.unlabelledControls.join("; ")}`),
    );
  }
  const isRendered = navigation.status !== null && navigation.status < HTTP_ERROR_STATUS;
  if (isRendered && measurements.bodyTextLength < MIN_BODY_TEXT_CHARS) {
    findings.push(makeFinding("empty-page", where, "The page rendered with almost no visible text"));
  }
  return findings;
}

export function pageFindings(observation: PageObservation): Finding[] {
  const where = { route: observation.route, viewport: observation.viewport };
  const { navigation } = observation;
  if (navigation.error) {
    return [makeFinding("navigation-failed", where, `Could not open the page: ${navigation.error}`)];
  }
  const status =
    navigation.status !== null && navigation.status >= HTTP_ERROR_STATUS
      ? [makeFinding("http-error", where, `Page returned ${navigation.status}`)]
      : [];
  return [...status, ...eventFindings(observation), ...layoutFindings(observation)];
}
