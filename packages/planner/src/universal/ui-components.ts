import type { Page } from "@repo/contracts";
import { PRIVATE_ROUTE_PATTERN } from "./constants";

const HOME_COMPONENTS = ["Testimonials", "Carousel"] as const;
const FORM_COMPONENTS = ["Modal"] as const;
const FORBIDDEN_TESTIMONIALS = /\bdo not invent\b[^.]*\btestimonials\b/i;
const ASKED_TESTIMONIALS = /\b(testimonial|reviews|social proof)\b/i;
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

function wantsReviewBlock(prompt: string): boolean {
  return ASKED_TESTIMONIALS.test(prompt) && !FORBIDDEN_TESTIMONIALS.test(prompt);
}

function withoutTestimonials(components: readonly string[]): string[] {
  return components.filter((name) => name !== "Testimonials");
}

export function withRequiredUiComponents(pages: readonly Page[], prompt = ""): Page[] {
  const reviews = wantsReviewBlock(prompt);
  return pages.map((page) => {
    const base = isPublicHome(page) && !reviews ? withoutTestimonials(page.components) : page.components;
    const extra: string[] = [];
    if (isPublicHome(page)) extra.push(...(reviews ? HOME_COMPONENTS : ["Carousel"]));
    if (isPublicForm(page)) extra.push(...FORM_COMPONENTS);
    if (extra.length === 0 && base === page.components) return page;
    return { ...page, components: uniqueComponents(base, extra) };
  });
}
