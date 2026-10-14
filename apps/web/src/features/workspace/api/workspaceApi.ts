import { httpClient } from "@/shared/lib/httpClient";
import { fileContentSchema, fileListSchema } from "../schemas/workspaceSchemas";

export const workspaceApi = {
  listFiles: (projectId: string, sessionId?: string, signal?: AbortSignal) => {
    const query = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : "";
    return httpClient
      .get(`/files/${projectId}${query}`, signal)
      .then(fileListSchema.parse);
  },
  readFile: (
    projectId: string,
    path: string,
    sessionId?: string,
    signal?: AbortSignal,
  ) => {
    const sessionQuery = sessionId
      ? `&sessionId=${encodeURIComponent(sessionId)}`
      : "";
    return httpClient
      .get(
        `/files/${projectId}/content?path=${encodeURIComponent(path)}${sessionQuery}`,
        signal,
      )
      .then(fileContentSchema.parse);
  },
};
