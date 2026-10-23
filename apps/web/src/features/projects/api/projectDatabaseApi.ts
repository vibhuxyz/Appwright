import {
  ProjectDatabaseListResponse,
  ProjectDatabaseResponse,
  type ProjectDatabaseEnvironment,
} from "@repo/contracts";
import { httpClient } from "@/shared/lib/httpClient";

export const projectDatabaseApi = {
  list: (projectId: string, signal?: AbortSignal) =>
    httpClient
      .get(`/v1/projects/${projectId}/databases`, signal)
      .then((r) => ProjectDatabaseListResponse.parse(r)),
  retry: (projectId: string, environment: ProjectDatabaseEnvironment) =>
    httpClient
      .post(`/v1/projects/${projectId}/databases/retry`, { environment })
      .then((r) => ProjectDatabaseResponse.parse(r)),
};
