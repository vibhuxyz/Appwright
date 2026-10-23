import { z } from "zod";

const EnvSchema = z.object({
  MONGODB_URI: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
});

const BUILD_PLACEHOLDERS = {};
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

export const env = EnvSchema.parse(isBuildPhase ? { ...BUILD_PLACEHOLDERS, ...process.env } : process.env);
