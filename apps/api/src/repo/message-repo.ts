import { Prisma, prisma, type Message } from "@repo/db";
import type { CreateMessageInput } from "./types";

const UNIQUE_CONSTRAINT_VIOLATION = "P2002";

function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === UNIQUE_CONSTRAINT_VIOLATION
  );
}

export class MessageRepository {
  constructor(private readonly userId: string) {}

  async list(sessionId: string): Promise<Message[]> {
    return prisma.message.findMany({
      where: {
        sessionId,
        session: { project: { userId: this.userId } },
      },
      orderBy: { seq: "asc" },
    });
  }

  // A requeued job replays the same (sessionId, seq) write. The unique
  // index on that pair is the idempotency key: a second write for a seq
  // already on disk is not an error, it's the expected shape of
  // at-least-once delivery — return what's there instead of throwing.
  async create(input: CreateMessageInput): Promise<Message> {
    const session = await prisma.session.findFirst({
      where: {
        id: input.sessionId,
        project: { userId: this.userId },
      },
      select: { id: true },
    });
    if (!session) {
      throw new Error(`Session not found: ${input.sessionId}`);
    }

    try {
      return await prisma.message.create({
        data: {
          sessionId: input.sessionId,
          seq: input.seq,
          role: input.role,
          type: input.type,
          content: input.content,
          data: input.data,
        },
      });
    } catch (error) {
      if (!isUniqueConstraintViolation(error)) throw error;

      const existing = await prisma.message.findUnique({
        where: { sessionId_seq: { sessionId: input.sessionId, seq: input.seq } },
      });
      if (!existing) throw error;
      return existing;
    }
  }
}
