import { turnStartSeq, type RevertedTurn } from "@repo/contracts";
import { prisma, type Prisma } from "@repo/db";
import { publishMessage } from "../stream/sse";
import { serializeRow } from "../workflow/message-mapper";
import type { RevertTarget } from "./find-target";

const MAX_SUBJECT_CHARS = 80;

function subjectOf(content: string): string {
  return content.replace(/\s+/g, " ").trim().slice(0, MAX_SUBJECT_CHARS);
}

function markerText(subject: string, turn: RevertedTurn): string {
  const where = turn.mainUpdated ? "this chat and from main" : "this chat";
  const mainNote = turn.mainError ? ` main was not updated: ${turn.mainError}` : "";
  return `↩️ Undid the turn "${subject}". Its code is removed from ${where}.${mainNote}`;
}

export async function recordRevertMarker(
  target: RevertTarget,
  outcome: Pick<RevertedTurn, "revertSha" | "mainUpdated" | "mainError">,
) {
  const rows = await prisma.message.findMany({
    where: { sessionId: target.sessionId, seq: { lte: target.seq } },
    orderBy: { seq: "asc" },
    select: { seq: true, role: true, type: true, content: true, data: true, createdAt: true },
  });
  const fromSeq = turnStartSeq(rows, target.seq) ?? target.seq;
  const fromRow = rows.find((row) => row.seq === fromSeq);
  const revertedTurn: RevertedTurn = {
    sha: target.sha,
    fromSeq,
    toSeq: target.seq,
    fromAt: (fromRow?.createdAt ?? target.createdAt).toISOString(),
    toAt: target.createdAt.toISOString(),
    ...outcome,
  };
  const last = await prisma.message.findFirst({ where: { sessionId: target.sessionId }, orderBy: { seq: "desc" }, select: { seq: true } });
  const row = await prisma.message.create({
    data: {
      sessionId: target.sessionId,
      seq: (last?.seq ?? -1) + 1,
      role: "assistant",
      type: "text",
      content: markerText(subjectOf(fromRow?.content ?? ""), revertedTurn),
      data: { transcriptOnly: true, revertMarker: true, revertedTurn } as Prisma.InputJsonValue,
    },
  });
  publishMessage(target.sessionId, { kind: "message", seq: row.seq, message: serializeRow(row) });
  return revertedTurn;
}
