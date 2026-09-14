// `bunx prisma ...` doesn't go through Bun's own `.env` auto-load the way
// `bun run <script>` does, so env("DATABASE_URL") below sees nothing unless
// something loads it first. Explicit path (not "dotenv/config"'s default
// cwd lookup) because this file itself is the thing bunx cd's next to —
// cwd here is packages/db, and .env lives at the repo root, two levels up.
import { config } from "dotenv";
import path from "node:path";

config({ path: path.resolve(import.meta.dirname, "../../.env") });

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
