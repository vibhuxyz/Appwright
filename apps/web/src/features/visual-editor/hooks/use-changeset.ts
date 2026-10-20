import { useMutation, useQueryClient } from "@tanstack/react-query";
import { editorApi } from "../api/editor-api";
import { editorKeys } from "../api/query-keys";
import { useDesignState } from "../store/design-state";
import type { ChangeSetInput } from "../schemas/editor-schemas";

export function readChangeSetInput(): ChangeSetInput {
  const { history, intents } = useDesignState.getState();
  return { changes: [...history.present], intents: [...intents] };
}

export function useCompileChangeSet(projectId: string) {
  return useMutation({
    mutationFn: () => editorApi.compileChangeSet(projectId, readChangeSetInput()),
  });
}

export function useSubmitChangeSet(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => editorApi.submitChangeSet(projectId, readChangeSetInput()),
    onSuccess: (result) => {
      if (result.status === "applied") useDesignState.getState().discard();
      return queryClient.invalidateQueries({ queryKey: editorKeys.components(projectId) });
    },
  });
}
