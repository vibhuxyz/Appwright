import { httpClient } from "@/shared/lib/httpClient";
import {
  projectOverviewResponseSchema,
  type ProjectOverviewResponse,
} from "../schemas/projectConsoleSchemas";

export const projectConsoleApi = {
  getOverview: (projectId: string, signal?: AbortSignal): Promise<ProjectOverviewResponse> =>
    httpClient
      .get(`/v1/projects/${encodeURIComponent(projectId)}/overview`, signal)
      .then((res) => projectOverviewResponseSchema.parse(res)),
};
