import { useMutation, useQueryClient } from "@tanstack/react-query";
import { planApi } from "../api/plan-api";
import { planKeys } from "../api/query-keys";

export interface BuildBlueprintInput {
  prompt: string;
  directionId?: string;
}

export function useBuildBlueprint(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ prompt, directionId }: BuildBlueprintInput) =>
      planApi.buildBlueprint(sessionId, prompt, directionId),
    onSuccess: (result) => {
      queryClient.setQueryData(planKeys.latestRun(sessionId), {
        blueprintId: result.blueprintId,
        runId: result.runId,
      });
    },
  });
}
