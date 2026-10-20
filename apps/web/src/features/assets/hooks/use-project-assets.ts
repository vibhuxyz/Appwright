import { useInfiniteQuery } from "@tanstack/react-query";
import { assetsApi } from "../api/assets-api";
import { assetKeys } from "../api/query-keys";

const INITIAL_PAGE_PARAM: string | undefined = undefined;

export function useProjectAssets(projectId: string) {
  return useInfiniteQuery({
    queryKey: assetKeys.project(projectId),
    queryFn: ({ pageParam }) => assetsApi.listProjectAssets(projectId, pageParam),
    initialPageParam: INITIAL_PAGE_PARAM,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
