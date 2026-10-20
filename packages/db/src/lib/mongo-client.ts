import { MongoClient } from "mongodb";
import { loadMongoEnv } from "./mongo-env";

let client: MongoClient | undefined;

export function getMongoClient(): MongoClient {
  if (client) return client;
  const { MONGODB_URI } = loadMongoEnv();
  client = new MongoClient(MONGODB_URI);
  return client;
}
