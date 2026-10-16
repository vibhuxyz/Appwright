import { config } from "dotenv";
import path from "node:path";

// Import this FIRST in any entrypoint, before @repo/contracts (or anything
// that imports it) — module evaluation order is source order, so setting
// WORKSPACE_ROOT here runs before projectFiles.ts reads it.

// `bun --filter api dev` (and turbo, which runs the same thing) sets cwd to
// apps/api/, not the repo root — Bun's own automatic `.env` loading is
// cwd-relative, so it silently finds nothing there and every var below
// falls through to its default (or, for DATABASE_URL downstream in
// @repo/db, becomes the literal string "undefined"). Explicit path fixes
// that regardless of cwd — same problem, same fix as packages/db/prisma.config.ts.
//
// Env vars loaded from the repo-root `.env` (see `.env.example`):
//   DATABASE_URL, REDIS_URL, AUTH_SECRET, SECRETS_ENCRYPTION_KEY,
//   provider keys (OPENAI_API_KEY / GEMINI_API_KEY / …), DEFAULT_MODEL,
//   PUBLIC_API_URL, WEB_APP_URL, PORT, WORKSPACE_ROOT,
//   EXECUTION_MODE ("sandboxed" enqueues to the agent worker; unset/other
//   keeps the in-process conversation runner), SANDBOX_PROVIDER, E2B_API_KEY.
// Cancel (/conversation/:id/stop), rate-limit, and preview routes do not
// change shape based on EXECUTION_MODE — only POST /conversation's 202 vs
// streaming path does.
config({ path: path.resolve(import.meta.dir, "../../../.env") });

// V0's CLI leaves WORKSPACE_ROOT unset and gets templates/ (pristine, for
// testing the agent directly). The API points it at .workspaces/ instead —
// the two-directory model (V1_WEB_APP.md): templates/ is read-only, agent
// runs land in .workspaces/<projectId>.
process.env.WORKSPACE_ROOT ??= path.resolve(
  import.meta.dir,
  "../../../.workspaces",
);

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function stripSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

// The two public origins. Everything that a *user's browser* is sent to is
// built from these, so getting them wrong is the difference between "works
// on my machine" and "nobody can connect".
export const PUBLIC_API_URL = stripSlash(
  process.env.PUBLIC_API_URL ?? "http://localhost:3001",
);
export const WEB_APP_URL = stripSlash(
  process.env.WEB_APP_URL ?? "http://localhost:3000",
);

const isLocal = (url: string) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)/.test(url);

if (
  process.env.NODE_ENV === "production" &&
  (isLocal(PUBLIC_API_URL) || isLocal(WEB_APP_URL))
) {
  throw new Error(
    "PUBLIC_API_URL / WEB_APP_URL still point at localhost in production. " +
      "Vercel redirects the user's browser to PUBLIC_API_URL, so localhost lands " +
      "on their laptop and OAuth silently fails. Set both to your public origin.",
  );
}
