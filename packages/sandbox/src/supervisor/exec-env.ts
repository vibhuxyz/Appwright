// LocalSandboxProvider runs the supervisor in the same process as the
// worker that spawns it, which means `process.env` here is the worker's
// own environment — DATABASE_URL, AUTH_SECRET, OPENAI_API_KEY, REDIS_URL.
// Spreading that into every exec call would hand LLM-authored `bash` your
// production credentials (the exact trap this doc names). An explicit
// allowlist, not a blocklist: only what common dev tooling needs to run.
const INHERITED_ENV_KEYS = [
  "PATH",
  "HOME",
  "USER",
  "LANG",
  "LC_ALL",
  "TMPDIR",
  "SHELL",
  "TERM",
] as const;

export function buildExecEnv(
  requestEnv: Record<string, string> | undefined,
): Record<string, string> {
  const base: Record<string, string> = {};
  for (const key of INHERITED_ENV_KEYS) {
    const value = process.env[key];
    if (value !== undefined) base[key] = value;
  }
  return { ...base, ...requestEnv };
}
