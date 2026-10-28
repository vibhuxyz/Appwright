import { STUB_DATABASE_HOST } from "../constants";

export class HarnessGuardError extends Error {}

export function assertIsolatedDatabase(env: NodeJS.Dict<string>): void {
  const url = env.DATABASE_URL ?? "";
  if (!url.includes(STUB_DATABASE_HOST)) {
    throw new HarnessGuardError(
      `Refusing to run: DATABASE_URL must point at ${STUB_DATABASE_HOST}. Use "bun run eval:site" so the shared database is never reachable.`,
    );
  }
}

export function assertModelKey(env: NodeJS.Dict<string>): void {
  if (!env.DEEPSEEK_API_KEY) throw new HarnessGuardError("DEEPSEEK_API_KEY is not set, so the DeepSeek model cannot be called");
}
