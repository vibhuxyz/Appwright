import { MongoClient } from "mongodb";
import { loadMongoEnv } from "./mongo-env";

let client: MongoClient | undefined;

const SERVER_SELECTION_TIMEOUT_MS = 10_000;

export function getMongoClient(): MongoClient {
  if (client) return client;
  const { MONGO_DB_PROJECT_DATABASE } = loadMongoEnv();
  client = new MongoClient(MONGO_DB_PROJECT_DATABASE, {
    serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
  });
  return client;
}

export async function closeMongoClient(): Promise<void> {
  if (!client) return;
  const current = client;
  client = undefined;
  await current.close();
}
