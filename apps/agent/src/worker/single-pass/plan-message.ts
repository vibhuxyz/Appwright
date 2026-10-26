const MAX_LISTED_ROUTES = 8;

export function singlePassPlanMessage(routes: readonly string[]): string {
  const shown = routes.slice(0, MAX_LISTED_ROUTES);
  const hidden = routes.length - shown.length;
  const listed = shown.map((route, index) => `${index + 1}. Build page ${route}`);
  return [
    "Plan (one pass, small static site):",
    "- Shared header, footer and theme",
    ...listed,
    ...(hidden > 0 ? [`(+${hidden} more pages)`] : []),
    "- Verify the build and fix any errors",
  ].join("\n");
}
