import { readFile } from "node:fs/promises";
import { TOPICS, type DocumentIngestedEvent } from "@repo/contracts";
import { publishEvent } from "@repo/events";
import { createLogger } from "@repo/logger";

// Entry point for the RAG pipeline. Takes a local file, splits it into fixed-
// size chunks (no sentence/token awareness — that's a real upgrade, not a
// stub, when it starts mattering), and publishes one `documentIngested`
// event. workers/indexing picks it up from there.
//
// Deliberately NOT here yet: a document source API, embeddings, a vector DB
// write. Those need an embedding provider (inference/servers/embedding) that
// doesn't exist. Faking that work here would be worse than not having it.

const CHUNK_SIZE = 2000;
const log = createLogger("worker-ingestion");

function chunk(text: string, size: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size)
    chunks.push(text.slice(i, i + size));
  return chunks;
}

export async function ingest(
  projectId: string,
  filePath: string,
): Promise<DocumentIngestedEvent> {
  const text = await readFile(filePath, "utf-8");
  const chunks = chunk(text, CHUNK_SIZE);
  const documentId = crypto.randomUUID();

  const event: DocumentIngestedEvent = {
    documentId,
    projectId,
    sourceUri: filePath,
  };
  await publishEvent(TOPICS.documentIngested, event, documentId);

  log.info("document ingested", {
    documentId,
    projectId,
    filePath,
    chunkCount: chunks.length,
  });
  return event;
}

if (import.meta.main) {
  const [projectId, filePath] = process.argv.slice(2);
  if (!projectId || !filePath) {
    console.error("usage: bun run src/index.ts <projectId> <filePath>");
    process.exit(1);
  }
  await ingest(projectId, filePath);
}
