import type { UnsplashSearchQuery } from "@repo/contracts";
import { UNSPLASH_SEARCH_ENDPOINT } from "./constants";

export function buildSearchUrl(query: UnsplashSearchQuery): URL {
  const url = new URL(UNSPLASH_SEARCH_ENDPOINT);
  url.searchParams.set("query", query.query);
  url.searchParams.set("page", String(query.page));
  url.searchParams.set("per_page", String(query.perPage));
  url.searchParams.set("content_filter", query.contentFilter);
  if (query.orientation) url.searchParams.set("orientation", query.orientation);
  if (query.color) url.searchParams.set("color", query.color);
  return url;
}

export function cacheKeyFor(query: UnsplashSearchQuery): string {
  return buildSearchUrl({ ...query, query: query.query.toLowerCase() }).search;
}
