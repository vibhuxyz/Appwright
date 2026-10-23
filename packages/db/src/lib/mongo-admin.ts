import type { MongoClient } from "mongodb";
import { getMongoClient } from "./mongo-client";
import { loadMongoEnv } from "./mongo-env";
import { redactSecrets } from "./mongo-redact";

export const APPWRIGHT_META_COLLECTION = "_appwright";

export type EnsureUserResult = "created" | "updated" | "unsupported";

export interface MongoAdmin {
  readonly adminUri: string;
  initializeDatabase(
    databaseName: string,
    meta: Record<string, unknown>,
  ): Promise<void>;
  databaseExists(databaseName: string): Promise<boolean>;
  ensureScopedUser(input: {
    databaseName: string;
    username: string;
    password: string;
  }): Promise<EnsureUserResult>;
  dropUser(databaseName: string, username: string): Promise<void>;
  dropDatabase(databaseName: string): Promise<void>;
}

function isUnsupportedUserAdmin(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const code = "code" in err ? err.code : undefined;
  const codeName = "codeName" in err ? String(err.codeName) : "";
  const message = err instanceof Error ? err.message : String(err);
  if (code === 13 || code === 18 || code === 31 || code === 8000) return true;
  if (codeName === "Unauthorized" || codeName === "AuthenticationFailed") {
    return true;
  }
  return /not authorized|requires authentication|not allowed|Atlas|createUser/i.test(
    message,
  );
}

export function createMongoAdmin(client: MongoClient, adminUri: string): MongoAdmin {
  return {
    adminUri,
    async initializeDatabase(databaseName, meta) {
      const db = client.db(databaseName);
      const collection = db.collection<{ _id: string }>(APPWRIGHT_META_COLLECTION);
      await collection.updateOne(
        { _id: "meta" },
        {
          $setOnInsert: { createdAt: new Date() },
          $set: { ...meta, updatedAt: new Date() },
        },
        { upsert: true },
      );
    },
    async databaseExists(databaseName) {
      const admin = client.db().admin();
      const { databases } = await admin.listDatabases({ nameOnly: true });
      return databases.some((entry) => entry.name === databaseName);
    },
    async ensureScopedUser({ databaseName, username, password }) {
      const db = client.db(databaseName);
      try {
        await db.command({
          updateUser: username,
          pwd: password,
          roles: [{ role: "readWrite", db: databaseName }],
        });
        return "updated";
      } catch (updateErr) {
        if (isUnsupportedUserAdmin(updateErr)) return "unsupported";
        try {
          await db.command({
            createUser: username,
            pwd: password,
            roles: [{ role: "readWrite", db: databaseName }],
          });
          return "created";
        } catch (createErr) {
          if (isUnsupportedUserAdmin(createErr)) return "unsupported";
          throw createErr;
        }
      }
    },
    async dropUser(databaseName, username) {
      const db = client.db(databaseName);
      try {
        await db.command({ dropUser: username });
      } catch (err) {
        if (isUnsupportedUserAdmin(err)) return;
        const message = err instanceof Error ? err.message : String(err);
        if (/not found|UserNotFound/i.test(message)) return;
        throw err;
      }
    },
    async dropDatabase(databaseName) {
      await client.db(databaseName).dropDatabase();
    },
  };
}

export function getMongoAdmin(): MongoAdmin {
  return createMongoAdmin(
    getMongoClient(),
    loadMongoEnv().MONGO_DB_PROJECT_DATABASE,
  );
}

export function mongoErrorDetail(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  return redactSecrets(raw).slice(0, 300);
}
