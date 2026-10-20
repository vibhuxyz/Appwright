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

// Same check, reached through a Run's session.
export async function ownedRunSessionId(
  runId: string,
  userId: string,
): Promise<string | null> {
  const row = await prisma.run.findFirst({
    where: { id: runId, session: { project: { userId } } },
    select: { sessionId: true },
  });
  return row?.sessionId ?? null;
}

// Same check, reached through a Blueprint's session.
export async function ownedBlueprintSessionId(
  blueprintId: string,
  userId: string,
): Promise<string | null> {
  const row = await prisma.blueprint.findFirst({
    where: { id: blueprintId, session: { project: { userId } } },
    select: { sessionId: true },
  });
  return row?.sessionId ?? null;
}

// Same check, reached through an AssetRequest's session.
export async function ownedAssetRequestSessionId(
  assetRequestId: string,
  userId: string,
): Promise<string | null> {
  const row = await prisma.assetRequest.findFirst({
    where: { id: assetRequestId, session: { project: { userId } } },
    select: { sessionId: true },
  });
  return row?.sessionId ?? null;
}

// Same check, reached through a ProjectAsset's project.
export async function ownedProjectAssetId(
  assetId: string,
  userId: string,
): Promise<string | null> {
  const row = await prisma.projectAsset.findFirst({
    where: { id: assetId, project: { userId } },
    select: { projectId: true },
  });
  return row?.projectId ?? null;
}
