import { makeFinding, type Finding } from "../findings";
import { mapWithConcurrency } from "../shared";
import type { DiscoveredLink } from "./types";

const MAX_LINKS_CHECKED = 40;
const LINK_CONCURRENCY = 5;
const LINK_TIMEOUT_MS = 10_000;
const HTTP_ERROR_STATUS = 400;
const LINK_VIEWPORT = "desktop";

function pathnameOf(href: string): string {
  return new URL(href).pathname;
}

function newLinks(links: readonly DiscoveredLink[], visitedRoutes: readonly string[]): DiscoveredLink[] {
  const visited = new Set(visitedRoutes);
  const seen = new Set<string>();
  const fresh: DiscoveredLink[] = [];
  for (const link of links) {
    const key = new URL(link.href).pathname + new URL(link.href).search;
    if (visited.has(pathnameOf(link.href)) || seen.has(key)) continue;
    seen.add(key);
    fresh.push(link);
  }
  return fresh.slice(0, MAX_LINKS_CHECKED);
}

async function statusOf(href: string): Promise<number | string> {
  try {
    const response = await fetch(href, { redirect: "follow", signal: AbortSignal.timeout(LINK_TIMEOUT_MS) });
    await response.body?.cancel();
    return response.status;
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "TypeError")) {
      return error.message;
    }
    throw error;
  }
}

export async function checkLinks(
  links: readonly DiscoveredLink[],
  visitedRoutes: readonly string[],
): Promise<Finding[]> {
  const toCheck = newLinks(links, visitedRoutes);
  const results = await mapWithConcurrency(toCheck, LINK_CONCURRENCY, async (link) => ({
    link,
    status: await statusOf(link.href),
  }));
  return results.flatMap(({ link, status }) => {
    const isBroken = typeof status === "string" || status >= HTTP_ERROR_STATUS;
    if (!isBroken) return [];
    const where = { route: link.from, viewport: LINK_VIEWPORT };
    return [makeFinding("broken-link", where, `Link to ${pathnameOf(link.href)} is broken (${status})`)];
  });
}
