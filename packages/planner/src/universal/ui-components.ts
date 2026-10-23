import type { Page } from "@repo/contracts";
import { PRIVATE_ROUTE_PATTERN } from "./constants";

const HOME_COMPONENTS = ["Testimonials", "Carousel"] as const;
const FORM_COMPONENTS = ["Modal"] as const;
const HOME_PATTERN = /(^\/$)|home|landing|marketing|hero/i;
const FORM_PATTERN = /form|contact|order|checkout|quote|request|signup|login|book/i;

function uniqueComponents(existing: readonly string[], extra: readonly string[]): string[] {
  const seen = new Set(existing);
  const components = [...existing];
  for (const name of extra) {
    if (seen.has(name)) continue;
    seen.add(name);
    components.push(name);
  }
  return components;
}

function isPublicHome(page: Page): boolean {
  if (PRIVATE_ROUTE_PATTERN.test(page.route)) return false;
  return HOME_PATTERN.test(`${page.route} ${page.purpose}`);
}

function isPublicForm(page: Page): boolean {
  if (PRIVATE_ROUTE_PATTERN.test(page.route)) return false;
  return FORM_PATTERN.test(`${page.route} ${page.purpose} ${page.components.join(" ")}`);
}

export function withRequiredUiComponents(pages: readonly Page[]): Page[] {
  return pages.map((page) => {
    const extra: string[] = [];
    if (isPublicHome(page)) extra.push(...HOME_COMPONENTS);
    if (isPublicForm(page)) extra.push(...FORM_COMPONENTS);
    if (extra.length === 0) return page;
    return { ...page, components: uniqueComponents(page.components, extra) };
  });
}
