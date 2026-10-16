import type { Message as CoreMessage } from "../types";

// The durable shape a Message row takes once read back from Postgres —
// deliberately not @repo/db's generated type, so this file stays usable from
// any process that has the row, not just one with a Prisma client attached.
export interface MessageRow {
  id: string;
  sessionId: string;
  seq: number;
  role: string;
  type: string;
  content: string;
  data: unknown;
  createdAt: Date;
}

export function serializeRow(row: MessageRow) {
  return {
    id: row.id,
    seq: row.seq,
    role: row.role,
    type: row.type,
    content: row.content,
    data: row.data,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toCoreMessage(row: MessageRow): CoreMessage {
  if (row.type === "text") {
    return {
      role: row.role as "user" | "assistant",
      type: "text",
      content: row.content,
    };
  }
  if (row.type === "toolCall") {
    const data = row.data as {
      toolCallId: string;
      toolName: string;
      args: Record<string, unknown>;
      providerMeta?: unknown;
    };
    return {
      role: "assistant",
      type: "toolCall",
      toolCallId: data.toolCallId,
      content: {
        toolName: data.toolName,
        args: data.args,
        providerMeta: data.providerMeta ?? undefined,
      },
    };
  }
  const data = row.data as { toolCallId: string };
  return {
    role: "tool",
    type: "toolResponse",
    toolCallId: data.toolCallId,
    content: row.content,
  };
}
