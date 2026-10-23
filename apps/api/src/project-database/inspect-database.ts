import type {
  DatabaseCollection,
  DatabaseDocumentsResponse,
  DatabaseOverviewResponse,
  Entity,
  ProjectDatabaseEnvironment,
  ProjectDatabaseStatus,
} from "@repo/contracts";
import { templateNeedsDatabase } from "@repo/contracts";
import { getMongoClient, prisma } from "@repo/db";
import { introspectLiveCollection, mergeBlueprintEntities } from "./introspect-collection.ts";
import { serializeDoc } from "./serialize-document.ts";

export async function inspectDatabase(
  projectId: string,
  userId: string,
): Promise<DatabaseOverviewResponse | null> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true, templateId: true },
  });
  if (!project) return null;

  if (!templateNeedsDatabase(project.templateId)) {
    return {
      projectId,
      databaseName: null,
      status: "ready" as ProjectDatabaseStatus,
      environment: null,
      provider: "mongodb",
      collections: [],
      totalDocuments: 0,
      totalIndexes: 0,
    };
  }

  const dbRow = await prisma.projectDatabase.findFirst({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });

  if (!dbRow || dbRow.status !== "READY" || !dbRow.databaseName) {
    const status = (dbRow?.status ? dbRow.status.toLowerCase() : "pending") as ProjectDatabaseStatus;
    const env = (dbRow?.environment ? dbRow.environment.toLowerCase() : "development") as ProjectDatabaseEnvironment;
    return {
      projectId,
      databaseName: dbRow?.databaseName ?? null,
      status,
      environment: env,
      provider: "mongodb",
      collections: [],
      totalDocuments: 0,
      totalIndexes: 0,
    };
  }

  const client = getMongoClient();
  const db = client.db(dbRow.databaseName);
  const liveList = await db.listCollections().toArray();

  const collections: DatabaseCollection[] = [];
  for (const item of liveList) {
    const coll = await introspectLiveCollection(db, item.name);
    collections.push(coll);
  }

  const blueprint = await prisma.blueprint.findFirst({
    where: { session: { projectId } },
    orderBy: { createdAt: "desc" },
    select: { entities: true },
  });

  if (blueprint?.entities && Array.isArray(blueprint.entities)) {
    mergeBlueprintEntities(collections, blueprint.entities as Entity[]);
  }

  const totalDocuments = collections.reduce((acc, c) => acc + c.documentCount, 0);
  const totalIndexes = collections.reduce((acc, c) => acc + c.indexes.length, 0);

  return {
    projectId,
    databaseName: dbRow.databaseName,
    status: "ready" as ProjectDatabaseStatus,
    environment: dbRow.environment.toLowerCase() as ProjectDatabaseEnvironment,
    provider: "mongodb",
    collections,
    totalDocuments,
    totalIndexes,
  };
}

export async function getCollectionDocuments(
  projectId: string,
  userId: string,
  collectionName: string,
  limit = 25,
  skip = 0,
): Promise<DatabaseDocumentsResponse | null> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  if (!project) return null;

  const dbRow = await prisma.projectDatabase.findFirst({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
  if (!dbRow || dbRow.status !== "READY" || !dbRow.databaseName) return null;

  const safeLimit = Math.min(Math.max(1, limit), 100);
  const safeSkip = Math.max(0, skip);

  const client = getMongoClient();
  const db = client.db(dbRow.databaseName);
  const col = db.collection(collectionName);

  const [total, rawDocs] = await Promise.all([
    col.countDocuments().catch(() => 0),
    col.find().skip(safeSkip).limit(safeLimit).toArray().catch(() => []),
  ]);

  return {
    items: rawDocs.map(serializeDoc),
    total,
    limit: safeLimit,
    skip: safeSkip,
  };
}
