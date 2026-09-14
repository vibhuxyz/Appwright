import {
  TOPICS,
  type DocumentIndexedEvent,
  type DocumentIngestedEvent,
} from "@repo/contracts";
import { consumeEvents, publishEvent } from "@repo/events";
import { createLogger } from "@repo/logger";

// Subscribes to `documentIngested` and is meant to embed each chunk into a
// vector DB, then publish `documentIndexed`. No embedding provider exists
// yet (see D58, docs/DECISIONS.md — that layer was scaffolded then removed
// on purpose, to be built by hand when a version actually needs it), so this
// currently republishes a pass-through event with a zero chunk count instead
// of pretending to have embedded anything. Replace the body of `handle` once
// one exists; the event contract (packages/contracts/src/events.ts) is
// already the real shape.

const log = createLogger("worker-indexing");

async function handle(event: DocumentIngestedEvent) {
  log.info("document received for indexing", event);

  const indexed: DocumentIndexedEvent = {
    documentId: event.documentId,
    chunkCount: 0,
  };
  await publishEvent(TOPICS.documentIndexed, indexed, event.documentId);
}

if (import.meta.main) {
  await consumeEvents(
    "worker-indexing",
    [TOPICS.documentIngested],
    async (_topic, event) => {
      await handle(event as DocumentIngestedEvent);
    },
  );
  log.info("worker-indexing listening", { topic: TOPICS.documentIngested });
}
