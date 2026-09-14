import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import { PrismaClient } from "../../generated/prisma/client";

// Absolute path, not "dotenv/config"'s default cwd lookup — a consumer's
// own cwd (apps/api under `bun --filter api dev`/turbo, apps/orchestrator,
// a script) varies, but this file's position relative to the repo root
// (packages/db/src/lib/) doesn't. Also acts as a fallback: if the real
// entrypoint (e.g. apps/api/src/env.ts) already loaded .env, `config()`
// here is a no-op — dotenv never overwrites an already-set process.env key.
config({ path: path.resolve(import.meta.dir, "../../../../.env") });

if (!process.env.DATABASE_URL) {
  // Fail loud, not with a connection string that's the literal text
  // "undefined" — that produced a confusing "Can't reach database server"
  // instead of pointing at the actual missing env var.
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env at the repo root.",
  );
}
const connectionString = process.env.DATABASE_URL;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function testConnection() {
  try {
    await prisma.$connect();
    console.log("🚀 Database connected successfully!");
  } catch (error) {
    console.error("Database connection failed!");
    console.error(error);
  }
}
export { prisma };
