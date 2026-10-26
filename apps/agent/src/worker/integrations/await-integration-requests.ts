import { AGENT_WAIT_LIMITS } from "@repo/contracts";
import {
  pollUntil,
  settleIntegrationRequests,
  type IntegrationRequestOutcome,
  type PollOutcome,
} from "@repo/db";

const PENDING = "PENDING";

export function awaitIntegrationRequests(input: {
  ids: readonly string[];
  signal: AbortSignal;
  timeoutMs: number;
}): Promise<PollOutcome<IntegrationRequestOutcome[]>> {
  return pollUntil({
    check: async () => {
      const settled = await settleIntegrationRequests({ ids: input.ids, now: new Date() });
      return settled.outcomes.some((outcome) => outcome.status === PENDING) ? null : settled.outcomes;
    },
    signal: input.signal,
    timeoutMs: input.timeoutMs,
    pollMs: AGENT_WAIT_LIMITS.pollMs,
  });
}
