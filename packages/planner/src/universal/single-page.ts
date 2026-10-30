import type { Blueprint, Page } from "@repo/contracts";
import { PRIVATE_ROUTE_PATTERN } from "./constants";
import type { SkippedAddition } from "./types";

const HOME_ROUTE = "/";

export interface SinglePageResult {
  readonly blueprint: Blueprint;
  readonly skipped: readonly SkippedAddition[];
}

function homeOf(pages: readonly Page[]): Page | undefined {
  return pages.find((page) => page.route === HOME_ROUTE) ?? pages.find((page) => !PRIVATE_ROUTE_PATTERN.test(page.route));
}

function isPublicExtra(page: Page, home: Page): boolean {
  return page.route !== home.route && !PRIVATE_ROUTE_PATTERN.test(page.route);
}

export function collapseToSinglePage(blueprint: Blueprint): SinglePageResult {
  const home = homeOf(blueprint.pages);
  if (!home || blueprint.pages.length <= 1) return { blueprint, skipped: [] };
  const extras = blueprint.pages.filter((page) => page !== home);
  const mergedComponents = [...new Set([...home.components, ...extras.filter((page) => isPublicExtra(page, home)).flatMap((page) => page.components)])];
  return {
    blueprint: { ...blueprint, pages: [{ ...home, route: HOME_ROUTE, components: mergedComponents }] },
    skipped: extras.map((page) => ({ kind: "page", name: page.route, reason: "the request is a single page, so it is a section of the home page" })),
  };
}
