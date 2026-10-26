import { INTEGRATION_CATALOG, type IntegrationProvider } from "../environment";

const CREDENTIAL_KEYS_BY_PROVIDER: ReadonlyMap<IntegrationProvider, readonly string[]> = new Map(
  INTEGRATION_CATALOG.map((entry) => [entry.provider, entry.fields.map((field) => field.key)]),
);

const SECRET_CREDENTIAL_KEYS: ReadonlySet<string> = new Set(
  INTEGRATION_CATALOG.flatMap((entry) =>
    entry.fields.filter((field) => field.isSecret).map((field) => field.key),
  ),
);

export const ALL_INTEGRATION_CREDENTIAL_KEYS: ReadonlySet<string> = new Set(
  INTEGRATION_CATALOG.flatMap((entry) => entry.fields.map((field) => field.key)),
);

export function integrationCredentialKeys(provider: IntegrationProvider): readonly string[] {
  return CREDENTIAL_KEYS_BY_PROVIDER.get(provider) ?? [];
}

export function isSecretCredentialKey(key: string): boolean {
  return SECRET_CREDENTIAL_KEYS.has(key);
}
