import { httpClient } from "@/shared/lib/httpClient";
import {
  databaseDocumentsResponseSchema,
  databaseOverviewResponseSchema,
  type DatabaseDocumentsResponse,
  type DatabaseOverviewResponse,
} from "../schemas/databaseSchemas";

export const databaseApi = {
  getOverview: (
    projectId: string,
    signal?: AbortSignal,
  ): Promise<DatabaseOverviewResponse> =>
    httpClient
      .get(`/v1/projects/${encodeURIComponent(projectId)}/database/overview`, signal)
      .then((res) => databaseOverviewResponseSchema.parse(res)),

  getDocuments: (
    projectId: string,
    collectionName: string,
    params?: { limit?: number; skip?: number },
    signal?: AbortSignal,
  ): Promise<DatabaseDocumentsResponse> => {
    const query = new URLSearchParams();
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.skip !== undefined) query.set("skip", String(params.skip));
    const qs = query.toString() ? `?${query.toString()}` : "";
    return httpClient
      .get(
        `/v1/projects/${encodeURIComponent(projectId)}/database/collections/${encodeURIComponent(collectionName)}/documents${qs}`,
        signal,
      )
      .then((res) => databaseDocumentsResponseSchema.parse(res));
  },
};
