import { httpClient } from "@/shared/lib/httpClient";
import { fileContentSchema, fileListSchema } from "../schemas/workspaceSchemas";

export const workspaceApi = {
  listFiles: (projectId: string, signal?: AbortSignal) =>
    httpClient.get(`/files/${projectId}`, signal).then(fileListSchema.parse),
  // Switching the selected file fast (arrow-key browsing a big tree) fires
  // one request per keystroke — `signal` lets each new request cancel the
  // one before it on the wire, not just discard its result.
  readFile: (projectId: string, path: string, signal?: AbortSignal) =>
    httpClient
      .get(`/files/${projectId}/content?path=${encodeURIComponent(path)}`, signal)
      .then(fileContentSchema.parse),
};
