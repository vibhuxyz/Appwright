const MAX_ROUTE_CHARS = 80;
const WATCHED_VISIT_LIMIT = 1;
const PARALLEL_VISIT_LIMIT = 3;

export function browserActivityLabel(
  route: string,
  viewport: string,
  phase: "scrolling" | "interacting",
): string {
  const name = route === "/" ? "home" : route.replace(/\s+/g, " ").trim().slice(0, MAX_ROUTE_CHARS);
  const action = phase === "scrolling" ? "scrolling" : "clicking and filling forms";
  return `${name} · ${viewport} · ${action}`;
}

export function browserVisitLimit(watching: boolean): number {
  return watching ? WATCHED_VISIT_LIMIT : PARALLEL_VISIT_LIMIT;
}
