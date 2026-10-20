import path from "node:path";
import { config } from "dotenv";
import { z } from "zod";

config({ path: path.resolve(import.meta.dir, "../../../../.env") });

const MONGO_URI_PATTERN = /^mongodb(\+srv)?:\/\//;

const mongoEnvSchema = z.object({
  MONGODB_URI: z
    .string()
    .min(1, "MONGODB_URI is not set")
    .regex(
      MONGO_URI_PATTERN,
      "MONGODB_URI must start with mongodb:// or mongodb+srv://",
    ),
});

export type MongoEnv = z.infer<typeof mongoEnvSchema>;

let cachedEnv: MongoEnv | undefined;

export function loadMongoEnv(): MongoEnv {
  if (cachedEnv) return cachedEnv;
  const result = mongoEnvSchema.safeParse({
    MONGODB_URI: process.env.MONGODB_URI,
  });
  if (!result.success) {
    throw new Error(
      `Invalid Mongo configuration: ${result.error.issues.map((issue) => issue.message).join(", ")}. Copy .env.example to .env at the repo root.`,
    );
  }
  cachedEnv = result.data;
  return cachedEnv;
}
