import { useDesignState } from "../store/design-state";
import { summarizePending } from "../lib/pending";

export function usePendingSummary() {
  const changes = useDesignState((s) => s.history.present);
  const intents = useDesignState((s) => s.intents);
  return summarizePending(
    changes,
    intents.map((intent) => intent.componentId),
  );
}
