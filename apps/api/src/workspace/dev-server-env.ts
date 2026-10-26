export const DEV_SERVER_ENV_ALLOWLIST = [
  "PATH",
  "HOME",
  "TMPDIR",
  "USER",
  "SHELL",
  "LANG",
  "LC_ALL",
  "TERM",
  "BUN_INSTALL",
  "NODE_ENV",
] as const;

export function devServerEnv(
  processEnv: Readonly<Record<string, string | undefined>>,
  runtimeEnv: Readonly<Record<string, string>>,
): Record<string, string> {
  const baseEnv: Record<string, string> = {};
  for (const key of DEV_SERVER_ENV_ALLOWLIST) {
    const value = processEnv[key];
    if (value !== undefined) baseEnv[key] = value;
  }
  return { ...baseEnv, ...runtimeEnv };
}
