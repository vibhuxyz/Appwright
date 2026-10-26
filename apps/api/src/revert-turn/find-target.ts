import { checkpointShaOf, revertedTurnOf } from "@repo/contracts";
import { prisma } from "@repo/db";
import { worktreeSessionIdOf } from "@repo/workspace";

const MAX_CHECKPOINT_ROWS = 50;
const ACTIVE_STATUSES: ReadonlySet<string> = new Set(["RUNNING", "AWAITING_APPROVAL"]);

export interface RevertTarget {
  readonly sessionId: string;
  readonly seq: number;
  readonly sha: string;
  readonly createdAt: Date;
}

export type TargetLookup =
  | { readonly kind: "found"; readonly target: RevertTarget }
  | { readonly kind: "run-active" }
  | { readonly kind: "nothing-to-revert" };

async function worktreeSessionIds(projectId: string, worktreeSessionId: string) {
  const sessions = await prisma.session.findMany({
    where: { projectId },
    select: { id: true, branch: true, status: true },
  });
  return sessions.filter((session) => worktreeSessionIdOf(session) === worktreeSessionId);
}

export async function findRevertTarget(projectId: string, worktreeSessionId: string): Promise<TargetLookup> {
  const sessions = await worktreeSessionIds(projectId, worktreeSessionId);
  if (sessions.some((session) => ACTIVE_STATUSES.has(session.status))) return { kind: "run-active" };
  const sessionIds = sessions.map((session) => session.id);
  const [checkpoints, markers] = await Promise.all([
    prisma.message.findMany({
      where: { sessionId: { in: sessionIds }, data: { path: ["checkpoint", "isTurnCommit"], equals: true } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: MAX_CHECKPOINT_ROWS,
      select: { sessionId: true, seq: true, data: true, createdAt: true },
    }),
    prisma.message.findMany({
      where: { sessionId: { in: sessionIds }, data: { path: ["revertMarker"], equals: true } },
      select: { data: true },
    }),
  ]);
  const revertedShas = new Set(markers.flatMap((row) => revertedTurnOf(row.data)?.sha ?? []));
  for (const row of checkpoints) {
    const sha = checkpointShaOf(row.data);
    if (sha && !revertedShas.has(sha)) {
      return { kind: "found", target: { sessionId: row.sessionId, seq: row.seq, sha, createdAt: row.createdAt } };
    }
  }
  return { kind: "nothing-to-revert" };
}
