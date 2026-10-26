import { agentStore, useAgentStore } from "../store/agentStore";
import { useCreateSession } from "./useSession";

export function useNewChat(projectId: string) {
  const createSession = useCreateSession(projectId);
  const running = useAgentStore((state) => state.running);
  const isBusy = running || createSession.isPending;
  return {
    isBusy,
    start: () => {
      if (isBusy) return;
      createSession.mutate(undefined, {
        onSuccess: () => agentStore.getState().reset([], false, ""),
      });
    },
  };
}
