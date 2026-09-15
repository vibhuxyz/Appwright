import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deploymentApi } from "../api/deploymentApi";
import { TERMINAL_DEPLOYMENT_STATES } from "../schemas/deploymentSchemas";

export function useVercelStatus() {
  return useQuery({
    queryKey: ["vercel-status"],
    queryFn: deploymentApi.getVercelStatus,
    // The OAuth flow finishes in the tab it opened in, not this one —
    // recheck when the user tabs back so "Connect" flips to "Deploy"
    // without a manual refresh.
    refetchOnWindowFocus: true,
  });
}

export function useConnectVercel() {
  return useMutation({
    mutationFn: (projectId: string) =>
      deploymentApi.startVercelConnect(projectId),
    onSuccess: ({ url }) => {
      window.open(url, "_blank", "noopener,noreferrer");
    },
  });
}

export function useDeploy(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deploymentApi.deploy(projectId),
    onSuccess: (deployment) => {
      queryClient.setQueryData(["deployment", projectId, deployment.id], deployment);
    },
  });
}

export function useDeploymentStatus(
  projectId: string,
  deploymentId: string | undefined,
) {
  return useQuery({
    queryKey: ["deployment", projectId, deploymentId],
    queryFn: () => deploymentApi.getDeployment(projectId, deploymentId!),
    enabled: !!deploymentId,
    refetchInterval: (query) => {
      const state = query.state.data?.readyState;
      return state && TERMINAL_DEPLOYMENT_STATES.has(state) ? false : 3000;
    },
  });
}
