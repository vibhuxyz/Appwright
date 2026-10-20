import { useQuery } from "@tanstack/react-query";
import { projectApi } from "../api/projectApi";

const STARTING_POLL_MS = 1500;
const LIVENESS_POLL_MS = 10_000;

// previewUrl is derived from an in-memory dev-server map on the API, which
// resets on every API restart — a cached previewUrl can point at a port
// that's since died or been reused by another project. Keep polling slowly
// even after it's set so a stale preview self-heals instead of sticking.
export function useProject(projectId: string) {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: ({ signal }) => projectApi.get(projectId, signal),
    refetchInterval: (query) =>
      query.state.data?.previewUrl ? LIVENESS_POLL_MS : STARTING_POLL_MS,
  });
}
