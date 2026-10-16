import {
  publishChannel,
  sessionChannel,
  type SseMessageFrame,
} from "@repo/cache";
import { Prisma, prisma, type Message } from "@repo/db";

const UNIQUE_CONSTRAINT_VIOLATION = "P2002";

function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === UNIQUE_CONSTRAINT_VIOLATION
  );
}

export interface PersistFields {
  role: string;
  type: string;
  content: string;
  data?: Record<string, unknown>;
}

// Same idempotency key as apps/api's message repo: (sessionId, seq) is
// unique in the database, so a requeued job replaying this write lands on
// the row that's already there instead of throwing.
export function createPersist(sessionId: string, startSeq: number) {
  let seq = startSeq;

  return async function persist(fields: PersistFields): Promise<Message> {
    const thisSeq = seq++;
    let row: Message;
    try {
      row = await prisma.message.create({
        data: {
          sessionId,
          seq: thisSeq,
          ...fields,
          content: fields.content.replaceAll("\u0000", ""),
          data: fields.data as Prisma.InputJsonValue | undefined,
        },
      });
    } catch (error) {
      if (!isUniqueConstraintViolation(error)) throw error;
      const existing = await prisma.message.findUnique({
        where: { sessionId_seq: { sessionId, seq: thisSeq } },
      });
      if (!existing) throw error;
      row = existing;
    }

    const frame: SseMessageFrame = {
      kind: "message",
      seq: row.seq,
      message: {
        id: row.id,
        seq: row.seq,
        role: row.role,
        type: row.type,
        content: row.content,
        data: row.data,
        createdAt: row.createdAt.toISOString(),
      },
    };
    await publishChannel(sessionChannel(sessionId), frame);
    return row;
  };
}

export function publishDelta(sessionId: string, delta: string): void {
  publishChannel(sessionChannel(sessionId), { kind: "delta", delta }).catch(
    () => {},
  );
}

export function publishStatus(
  sessionId: string,
  status: "IDLE" | "RUNNING" | "AWAITING_APPROVAL" | "ERROR",
  detail?: string,
  reason?: string,
): void {
  publishChannel(sessionChannel(sessionId), {
    kind: "status",
    status,
    detail,
    reason,
  }).catch(() => {});
}
