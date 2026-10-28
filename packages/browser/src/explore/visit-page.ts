import { join } from "node:path";
import { screenshotName, type Finding, type Viewport } from "../findings";
import type { BrowserPage, BrowserSession, PageMeasurements } from "../session";
import { pageFindings } from "../visual";
import type { VisitResult } from "./types";

const EMPTY_MEASUREMENTS: PageMeasurements = {
  viewportWidth: 0,
  scrollWidth: 0,
  bodyTextLength: 0,
  overflowing: [],
  brokenImages: [],
  unlabelledControls: [],
  clippedText: [],
  overlappingText: [],
  links: [],
};

async function observe(page: BrowserPage, url: string) {
  const navigation = await page.navigate(url);
  if (navigation.error) {
    return { navigation, measurements: EMPTY_MEASUREMENTS, events: page.drainEvents() };
  }
  await page.scrollThrough();
  const measurements = await page.measure();
  return { navigation, measurements, events: page.drainEvents() };
}

function withScreenshot(findings: readonly Finding[], screenshot: string): Finding[] {
  return findings.map((finding) => ({ ...finding, screenshot }));
}

export async function visitPage(
  session: BrowserSession,
  options: {
    readonly baseUrl: string;
    readonly route: string;
    readonly viewport: Viewport;
    readonly outputDir: string;
    readonly captureAll?: boolean;
  },
): Promise<VisitResult> {
  const { baseUrl, route, viewport, outputDir, captureAll = false } = options;
  const url = new URL(route, baseUrl).toString();
  const page = await session.openPage(viewport);
  try {
    const observed = await observe(page, url);
    const findings = pageFindings({ route, viewport: viewport.name, pageUrl: url, ...observed });
    const links = observed.measurements.links.map((href) => ({ href, from: route }));
    if (findings.length === 0 && !captureAll) return { findings, links };
    const name = screenshotName(route, viewport);
    await page.screenshot(join(outputDir, name));
    return { findings: withScreenshot(findings, name), links, screenshot: name };
  } finally {
    await page.close();
  }
}
