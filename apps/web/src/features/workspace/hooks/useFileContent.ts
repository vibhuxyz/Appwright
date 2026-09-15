import { useQuery } from "@tanstack/react-query";
import { workspaceApi } from "../api/workspaceApi";

export function useFileContent(projectId: string, path: string | null) {
  return useQuery({
    queryKey: ["file-content", projectId, path],
    queryFn: ({ signal }) =>
      workspaceApi.readFile(projectId, path!, signal).then((r) => r.content),
    enabled: path !== null,
  });
}
