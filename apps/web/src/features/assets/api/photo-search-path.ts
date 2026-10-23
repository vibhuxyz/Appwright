import type { UnsplashOrientation } from "@repo/contracts";

export interface PhotoSearchParams {
  query: string;
  page: number;
  orientation?: UnsplashOrientation;
}

export function photoSearchPath(params: PhotoSearchParams): string {
  const search = new URLSearchParams({ query: params.query, page: String(params.page) });
  if (params.orientation) search.set("orientation", params.orientation);
  return `/unsplash/search?${search.toString()}`;
}
