import { prisma } from "@repo/db";

// Every project-scoped route funnels through this. The userId goes in the
// where-clause, not an if-statement after the lookup, so "not yours" and
// "not there" are the same 404 — a 403 would confirm the project exists.
export async function ownedProjectId(
  projectId: string,
  userId: string,
): Promise<string | null> {
  const row = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  return row?.id ?? null;
}

// Same check, reached through the session instead of directly.
export async function ownedSessionProjectId(
  sessionId: string,
  userId: string,
): Promise<string | null> {
  const row = await prisma.session.findFirst({
    where: { id: sessionId, project: { userId } },
    select: { projectId: true },
  });
  return row?.projectId ?? null;
}
