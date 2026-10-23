import { useQuery } from "@tanstack/react-query";
import type { ThemeOptionsRequest } from "@repo/contracts";
import { themeApi } from "../api/theme-api";

export function useThemeOptions(request: ThemeOptionsRequest | null) {
  return useQuery({
    queryKey: ["theme-options", request],
    queryFn: ({ signal }) => themeApi.getOptions(request!, signal),
    enabled: Boolean(request?.prompt),
    staleTime: Number.POSITIVE_INFINITY,
    retry: 1,
  });
}
