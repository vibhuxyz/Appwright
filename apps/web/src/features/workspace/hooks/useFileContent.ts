import { useQuery } from "@tanstack/react-query";
import { workspaceApi } from "../api/workspaceApi";

export function useFileContent(
  projectId: string,
  path: string | null,
  sessionId?: string,
) {
  return useQuery({
    queryKey: ["file-content", projectId, path, sessionId],
    queryFn: ({ signal }) => {
      if (!path) return "";
      return workspaceApi
        .readFile(projectId, path, sessionId, signal)
        .then((r) => r.content);
    },
    enabled: path !== null,
  });
}
