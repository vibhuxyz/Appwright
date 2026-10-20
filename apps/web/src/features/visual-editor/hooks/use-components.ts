import { useQuery } from "@tanstack/react-query";
import { editorApi } from "../api/editor-api";
import { editorKeys } from "../api/query-keys";

const COMPONENT_GRAPH_STALE_MS = 5_000;

export function useComponents(projectId: string) {
  return useQuery({
    queryKey: editorKeys.components(projectId),
    queryFn: ({ signal }) => editorApi.getComponents(projectId, signal),
    staleTime: COMPONENT_GRAPH_STALE_MS,
  });
}
