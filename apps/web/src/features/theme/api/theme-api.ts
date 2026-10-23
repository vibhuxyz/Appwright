import { ThemeOptionsResponse, type ThemeOptionsRequest } from "@repo/contracts";
import { httpClient } from "@/shared/lib/httpClient";

export const themeApi = {
  getOptions: (request: ThemeOptionsRequest, signal?: AbortSignal) =>
    httpClient.post("/v1/theme-options", request, signal).then(ThemeOptionsResponse.parse),
};
