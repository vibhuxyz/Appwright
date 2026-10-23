export const MAX_ROUTES = 12;

const PAGE_FILE = /(?:^|\/)page\.(?:tsx|jsx|ts|js|mdx)$/;
const APP_ROOT = /^(?:src\/)?app\//;
const ROUTE_GROUP = /^\(.*\)$/;

export interface SkippedRoute {
  readonly path: string;
  readonly reason: string;
}

export interface DiscoveredRoutes {
  readonly routes: readonly string[];
  readonly skipped: readonly SkippedRoute[];
}

function segmentsOf(filePath: string): string[] {
  return filePath
    .replace(APP_ROOT, "")
    .replace(PAGE_FILE, "")
    .split("/")
    .filter((segment) => segment.length > 0 && !ROUTE_GROUP.test(segment));
}

function skipReason(segments: readonly string[]): string | undefined {
  if (segments[0] === "api") return "API route";
  if (segments.some((segment) => segment.startsWith("["))) return "dynamic segment needs real data";
  if (segments.some((segment) => segment.startsWith("@") || segment.startsWith("_"))) {
    return "private or parallel segment";
  }
  return undefined;
}

export function discoverRoutes(filePaths: readonly string[]): DiscoveredRoutes {
  const candidates = filePaths
    .map((path) => path.replaceAll("\\", "/"))
    .filter((path) => APP_ROOT.test(path) && PAGE_FILE.test(path))
    .sort();
  const skipped: SkippedRoute[] = [];
  const routes = new Set<string>();
  for (const path of candidates) {
    const segments = segmentsOf(path);
    const reason = skipReason(segments);
    if (reason) {
      skipped.push({ path, reason });
      continue;
    }
    routes.add(`/${segments.join("/")}`);
  }
  const ordered = [...routes].sort((a, b) => a.split("/").length - b.split("/").length || a.localeCompare(b));
  const kept = ordered.slice(0, MAX_ROUTES);
  const overflow = ordered.slice(MAX_ROUTES).map((route) => ({ path: route, reason: `over the ${MAX_ROUTES}-route cap` }));
  return { routes: kept, skipped: [...skipped, ...overflow] };
}
