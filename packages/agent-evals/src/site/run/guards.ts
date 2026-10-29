import { ENDPOINTS, providerFor } from "@repo/agent-core";
import { SITE_MODEL_ENV_KEY, STUB_DATABASE_HOST } from "../constants";

export class HarnessGuardError extends Error {}

export function assertIsolatedDatabase(env: NodeJS.Dict<string>): void {
  const url = env.DATABASE_URL ?? "";
  if (!url.includes(STUB_DATABASE_HOST)) {
    throw new HarnessGuardError(
      `Refusing to run: DATABASE_URL must point at ${STUB_DATABASE_HOST}. Use "bun run eval:site" so the shared database is never reachable.`,
    );
  }
}

export function requireSiteModel(env: NodeJS.Dict<string>): string {
  const model = env[SITE_MODEL_ENV_KEY]?.trim();
  if (!model) throw new HarnessGuardError(`${SITE_MODEL_ENV_KEY} is not set, so the eval has no model to call`);
  const { envKey } = ENDPOINTS[providerFor(model)];
  if (!env[envKey]) throw new HarnessGuardError(`${envKey} is not set, so ${model} cannot be called`);
  return model;
}
