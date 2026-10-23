import { discoverRoutes, MAX_ROUTES, type SkippedRoute } from "./discover-routes";

const SOURCE_FILE = /^(?:src\/|app\/)/;
const APP_FILE = /^(?:src\/)?app\//;
const ROUTE_GROUP = /^\(.*\)$/;

export function routesForChanges(changedPaths: readonly string[], pageFiles: readonly string[]): string[] {
  const known = discoverRoutes(pageFiles).routes;
  const wanted = new Set<string>();
  let sawSource = false;
  for (const changed of changedPaths) {
    const path = changed.replaceAll("\\", "/");
    if (!SOURCE_FILE.test(path)) continue;
    sawSource = true;
    const route = routeForChange(path, known);
    if (route) wanted.add(route);
  }
  if (wanted.size === 0 && sawSource) {
    const home = known.includes("/") ? "/" : known[0];
    if (home) wanted.add(home);
  }
  return sortRoutes([...wanted]).slice(0, MAX_ROUTES);
}

function routeForChange(path: string, known: readonly string[]): string | undefined {
  const direct = discoverRoutes([path]).routes[0];
  if (direct && known.includes(direct)) return direct;
  if (!APP_FILE.test(path)) return undefined;
  return nearestAppRoute(path, known);
}

function nearestAppRoute(path: string, known: readonly string[]): string | undefined {
  const body = path.replace(/^(?:src\/)?app\//, "");
  const parts = body.split("/").slice(0, -1).filter((segment) => segment.length > 0 && !ROUTE_GROUP.test(segment));
  while (parts.length > 0) {
    const candidate = `/${parts.join("/")}`;
    if (known.includes(candidate)) return candidate;
    parts.pop();
  }
  return known.includes("/") ? "/" : undefined;
}

export function selectCheckRoutes(
  pageFiles: readonly string[],
  changedPaths: readonly string[] | undefined,
): { readonly routes: readonly string[]; readonly skipped: readonly SkippedRoute[]; readonly scoped: boolean } {
  const discovered = discoverRoutes(pageFiles);
  if (changedPaths === undefined) {
    return { routes: discovered.routes, skipped: discovered.skipped, scoped: false };
  }
  return { routes: routesForChanges(changedPaths, pageFiles), skipped: [], scoped: true };
}

function sortRoutes(routes: string[]): string[] {
  return routes.sort((a, b) => a.split("/").length - b.split("/").length || a.localeCompare(b));
}
