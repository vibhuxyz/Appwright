import { useQuery } from "@tanstack/react-query";
import { projectApi } from "../api/projectApi";

// Polls until the dev server reports a preview URL, then goes quiet — the
// project record settles once and doesn't change again after that.
export function useProject(projectId: string) {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: ({ signal }) => projectApi.get(projectId, signal),
    refetchInterval: (query) => (query.state.data?.previewUrl ? false : 1500),
  });
}
