// Kafka topic names and their payload shapes, shared between every producer
// and consumer (apps/api publishes, workers/* subscribe) so a rename can't
// silently desync into "nobody's listening." Add a topic here before using
// its string literal anywhere else.

export const TOPICS = {
  documentIngested: "appwright.documents.ingested",
  documentIndexed: "appwright.documents.indexed",
  evaluationRequested: "appwright.evaluation.requested",
} as const;

export type Topic = (typeof TOPICS)[keyof typeof TOPICS];

export interface DocumentIngestedEvent {
  documentId: string;
  projectId: string;
  sourceUri: string;
}

export interface DocumentIndexedEvent {
  documentId: string;
  chunkCount: number;
}

export interface EvaluationRequestedEvent {
  runId: string;
  projectId: string;
}
