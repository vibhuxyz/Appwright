import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import type { UnsplashOrientation } from "@repo/contracts";
import { useDebouncedValue } from "@/shared/hooks";
import { assetKeys } from "../api/query-keys";
import { unsplashApi } from "../api/unsplash-api";

export const PHOTO_SEARCH_DEBOUNCE_MS = 400;
const PHOTO_SEARCH_STALE_MS = 10 * 60_000;
const FIRST_PAGE = 1;

export function usePhotoSearch(rawQuery: string, orientation: UnsplashOrientation | undefined) {
  const trimmed = rawQuery.trim();
  const query = useDebouncedValue(trimmed, PHOTO_SEARCH_DEBOUNCE_MS);

  const result = useInfiniteQuery({
    queryKey: assetKeys.photoSearch(query, orientation),
    queryFn: ({ pageParam, signal }) => unsplashApi.search({ query, page: pageParam, orientation }, signal),
    initialPageParam: FIRST_PAGE,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    enabled: query.length > 0,
    staleTime: PHOTO_SEARCH_STALE_MS,
    placeholderData: keepPreviousData,
    retry: false,
  });

  return { ...result, query, isWaitingForTyping: trimmed !== query };
}
