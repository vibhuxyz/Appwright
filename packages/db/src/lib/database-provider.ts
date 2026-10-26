import { MongoClient } from "mongodb";
import { redactSecrets } from "./mongo-redact";

export interface DatabaseConnectionTestResult {
  ok: boolean;
  message: string;
  latencyMs?: number;
}

export interface DatabaseProvider {
  readonly provider: string;
  testConnection(uri: string): Promise<DatabaseConnectionTestResult>;
}

const TEST_TIMEOUT_MS = 2500;

export class MongoDatabaseProvider implements DatabaseProvider {
  readonly provider = "mongodb";

  async testConnection(uri: string): Promise<DatabaseConnectionTestResult> {
    if (!uri || !uri.trim()) {
      return { ok: false, message: "MongoDB connection URI is missing" };
    }

    const start = Date.now();
    let client: MongoClient | undefined;
    try {
      client = new MongoClient(uri, {
        serverSelectionTimeoutMS: TEST_TIMEOUT_MS,
        connectTimeoutMS: TEST_TIMEOUT_MS,
      });
      await client.connect();
      await client.db().command({ ping: 1 });
      const latencyMs = Date.now() - start;
      return {
        ok: true,
        message: `Successfully connected to MongoDB (${latencyMs}ms)`,
        latencyMs,
      };
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : String(err);
      const safeMessage = redactSecrets(rawMessage);
      return {
        ok: false,
        message: `MongoDB connection failed: ${safeMessage}`,
      };
    } finally {
      if (client) {
        await client.close().catch(() => {});
      }
    }
  }
}

export const mongoDatabaseProvider = new MongoDatabaseProvider();

const PROVIDERS: Record<string, DatabaseProvider> = {
  mongodb: mongoDatabaseProvider,
};

export function getDatabaseProvider(provider: string): DatabaseProvider | undefined {
  return PROVIDERS[provider];
}
