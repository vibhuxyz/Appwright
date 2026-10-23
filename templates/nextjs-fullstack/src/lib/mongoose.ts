import mongoose from "mongoose";

interface MongooseCache {
  connection: typeof mongoose | null;
  pending: Promise<typeof mongoose> | null;
}

const globalCache = globalThis as typeof globalThis & { mongooseCache?: MongooseCache };
const cache: MongooseCache = (globalCache.mongooseCache ??= { connection: null, pending: null });

function readMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set. Add it to .env.local.");
  return uri;
}

export async function connectDb(): Promise<typeof mongoose> {
  if (cache.connection) return cache.connection;
  cache.pending ??= mongoose.connect(readMongoUri(), { bufferCommands: false });
  try {
    cache.connection = await cache.pending;
  } catch (error) {
    cache.pending = null;
    throw error;
  }
  return cache.connection;
}
