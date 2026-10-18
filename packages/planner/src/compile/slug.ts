const NON_ALPHANUMERIC = /[^a-z0-9]+/g;
const EDGE_DASHES = /^-+|-+$/g;
const CAMEL_BOUNDARY = /([a-z0-9])([A-Z])/g;

export function toSlug(text: string): string {
  return text
    .replace(CAMEL_BOUNDARY, "$1-$2")
    .toLowerCase()
    .replace(NON_ALPHANUMERIC, "-")
    .replace(EDGE_DASHES, "");
}

export function routeToSlug(route: string): string {
  return toSlug(route) || "home";
}

export function routeToPageFile(route: string): string {
  const directory = route.replace(/^\/+|\/+$/g, "");
  return directory ? `src/app/${directory}/page.tsx` : "src/app/page.tsx";
}
