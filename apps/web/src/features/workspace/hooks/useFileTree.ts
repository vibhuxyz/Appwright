import { useQuery } from "@tanstack/react-query";
import { workspaceApi } from "../api/workspaceApi";

// `touchedCount` busts the cache when the agent writes files mid-run — the
// tree can't otherwise know a new file exists.
export function useFileTree(
  projectId: string,
  touchedCount: number,
  sessionId?: string,
) {
  return useQuery({
    queryKey: ["file-tree", projectId, touchedCount, sessionId],
    queryFn: ({ signal }) =>
      workspaceApi.listFiles(projectId, sessionId, signal).then((r) => r.paths),
    refetchOnMount: "always",
  });
}
