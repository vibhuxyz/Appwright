import { TOPICS, type EvaluationRequestedEvent } from "@repo/contracts";
import { consumeEvents } from "@repo/events";
import { createLogger } from "@repo/logger";

// Subscribes to `evaluationRequested`. There is nothing to evaluate yet — no
// self-hosted model exists to compare (see D58, docs/DECISIONS.md), so
// there's no Model A vs Model B on accuracy/latency/cost/tool-calling. This
// worker exists so the event contract and the consumer-group wiring are
// proven before the thing being evaluated exists, not so the scoring logic
// can be faked here.

const log = createLogger("worker-evaluation");

async function handle(event: EvaluationRequestedEvent) {
  log.info("evaluation requested", event);
  // TODO: once a self-hosted model exists to evaluate (D58), run the
  // request against each candidate and record accuracy/latency/cost.
}

if (import.meta.main) {
  await consumeEvents(
    "worker-evaluation",
    [TOPICS.evaluationRequested],
    async (_topic, event) => {
      await handle(event as EvaluationRequestedEvent);
    },
  );
  log.info("worker-evaluation listening", {
    topic: TOPICS.evaluationRequested,
  });
}
