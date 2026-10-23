import path from "node:path";
import { config } from "dotenv";
import { z } from "zod";

config({ path: path.resolve(import.meta.dir, "../../../../.env") });

const MONGO_URI_PATTERN = /^mongodb(\+srv)?:\/\//;

const mongoUri = z
  .string()
  .min(1)
  .regex(
    MONGO_URI_PATTERN,
    "must start with mongodb:// or mongodb+srv://",
  );

const mongoEnvSchema = z.object({
  MONGO_DB_PROJECT_DATABASE: mongoUri,
});

export type MongoEnv = z.infer<typeof mongoEnvSchema>;

let cachedEnv: MongoEnv | undefined;

function clusterUriFromProcess(): string | undefined {
  const dedicated = process.env.MONGO_DB_PROJECT_DATABASE?.trim();
  if (dedicated) return dedicated;
  const legacy = process.env.MONGODB_URI?.trim();
  return legacy || undefined;
}

export function loadMongoEnv(): MongoEnv {
  if (cachedEnv) return cachedEnv;
  const result = mongoEnvSchema.safeParse({
    MONGO_DB_PROJECT_DATABASE: clusterUriFromProcess(),
  });
  if (!result.success) {
    throw new Error(
      "Invalid Mongo configuration: MONGO_DB_PROJECT_DATABASE is not set or is not a mongodb:// / mongodb+srv:// URI. This is the shared cluster that hosts each generated project's logical database. Copy .env.example to .env at the repo root.",
    );
  }
  cachedEnv = result.data;
  return cachedEnv;
}

export function clearMongoEnvCache(): void {
  cachedEnv = undefined;
}
