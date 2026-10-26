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
  downloadProject: async (
    projectId: string,
    sessionId?: string,
    filename?: string,
  ) => {
    const sessionQuery = sessionId
      ? `?sessionId=${encodeURIComponent(sessionId)}`
      : "";
    const blob = await httpClient.getBlob(
      `/files/${projectId}/download${sessionQuery}`,
    );
    if (!blob) throw new Error("Could not download project files");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `${projectId}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
