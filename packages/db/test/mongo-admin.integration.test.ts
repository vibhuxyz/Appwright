import { afterAll, describe, expect, it } from "bun:test";
import { MongoClient } from "mongodb";
import { createMongoAdmin } from "../src/lib/mongo-admin";
import { toProjectDatabaseName } from "../src/lib/project-db";

const TEST_URI = "mongodb://localhost:27017";

describe("mongo admin initializeDatabase", () => {
  const client = new MongoClient(TEST_URI, { serverSelectionTimeoutMS: 1500 });
  const names: string[] = [];

  afterAll(async () => {
    for (const name of names) {
      await client.db(name).dropDatabase().catch(() => undefined);
    }
    await client.close().catch(() => undefined);
  });

  it("creates distinct project databases on the shared cluster", async () => {
    try {
      await client.connect();
    } catch {
      return;
    }

    const admin = createMongoAdmin(client, TEST_URI);
    const dbA = toProjectDatabaseName("intega1", "development");
    const dbB = toProjectDatabaseName("integb2", "development");
    names.push(dbA, dbB);

    await admin.initializeDatabase(dbA, { projectId: "intega1" });
    await admin.initializeDatabase(dbB, { projectId: "integb2" });
    await admin.initializeDatabase(dbA, { projectId: "intega1" });

    expect(await admin.databaseExists(dbA)).toBe(true);
    expect(await admin.databaseExists(dbB)).toBe(true);
    expect(dbA).not.toBe(dbB);

    const userResult = await admin.ensureScopedUser({
      databaseName: dbA,
      username: "u_intega1_dev",
      password: "test-password-not-for-prod",
    });
    expect(["created", "updated", "unsupported"]).toContain(userResult);
  });
});
