import { useQuery } from "@tanstack/react-query";
import { assetsApi } from "../api/assets-api";
import { assetKeys } from "../api/query-keys";

const POLL_INTERVAL_MS = 1000;

export function useAssetRequests(sessionId?: string, _running = false) {
  return useQuery({
    queryKey: assetKeys.requests(sessionId ?? "none"),
    queryFn: () => (sessionId ? assetsApi.listAssetRequests(sessionId) : Promise.resolve([])),
    enabled: Boolean(sessionId),
    refetchInterval: (query) => {
      const hasPending = query.state.data?.some((request) => request.status === "PENDING");
      return hasPending ? POLL_INTERVAL_MS : false;
    },
  });
}
