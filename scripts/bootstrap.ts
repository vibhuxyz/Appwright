#!/usr/bin/env bun
import { $ } from "bun";

// bun run scripts/bootstrap.ts
// First-run setup: install deps, generate the Prisma client, and check for
// the env vars apps/api actually requireEnv()s at startup (see
// apps/api/src/env.ts, packages/auth/src/index.ts) so a missing var fails
// here with a clear message instead of a stack trace mid-request later.

console.log("→ bun install");
await $`bun install`;

console.log("→ prisma generate");
await $`cd packages/db && bunx --bun prisma generate`;

const required = ["DATABASE_URL", "AUTH_SECRET"];
const missing = required.filter((name) => !process.env[name]);

console.log();
if (missing.length > 0) {
  console.log(`Missing env vars: ${missing.join(", ")}`);
  console.log(
    "Set them (e.g. in .env.local) before running `bun run dev:api`.",
  );
  console.log(
    "DATABASE_URL example: postgresql://appwright:appwright@localhost:5432/appwright",
  );
  console.log(
    "AUTH_SECRET: any long random string — used to sign JWTs, see packages/auth.",
  );
} else {
  console.log(
    "All required env vars are set. Run `bun run dev` to start the stack.",
  );
}
