import { getMongoAdmin, mongoErrorDetail, type MongoAdmin } from "./mongo-admin";
import { prisma } from "./prisma";

export async function reapDueDatabaseDeletions(
  deps: { mongo?: MongoAdmin; now?: () => Date } = {},
): Promise<{ completed: number; failed: number }> {
  const now = deps.now?.() ?? new Date();
  const due = await prisma.databaseDeletion.findMany({
    where: { status: "scheduled", deleteAfter: { lte: now } },
    take: 20,
  });
  if (due.length === 0) return { completed: 0, failed: 0 };

  const mongo = deps.mongo ?? getMongoAdmin();
  let completed = 0;
  let failed = 0;

  for (const row of due) {
    try {
      await mongo.dropUser(row.databaseName, row.username);
      await mongo.dropDatabase(row.databaseName);
      await prisma.databaseDeletion.update({
        where: { id: row.id },
        data: { status: "completed", lastErrorCode: null },
      });
      completed += 1;
    } catch (err) {
      await prisma.databaseDeletion.update({
        where: { id: row.id },
        data: {
          status: "failed",
          lastErrorCode: mongoErrorDetail(err).slice(0, 80),
        },
      });
      failed += 1;
    }
  }

  return { completed, failed };
}
