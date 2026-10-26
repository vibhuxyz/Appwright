import { ALL_INTEGRATION_CREDENTIAL_KEYS, type ProjectEnvironmentVariableResponse } from "@repo/contracts";

const SHARED_SCOPE = "all";

function isEmptyCredentialPlaceholder(variable: ProjectEnvironmentVariableResponse): boolean {
  return ALL_INTEGRATION_CREDENTIAL_KEYS.has(variable.key) && variable.maskedValue === null;
}

export function selectVariablesForEnvironment(
  variables: readonly ProjectEnvironmentVariableResponse[],
  environment: string,
): ProjectEnvironmentVariableResponse[] {
  const byKey = new Map<string, ProjectEnvironmentVariableResponse>();
  for (const variable of variables) {
    if (variable.environment !== environment && variable.environment !== SHARED_SCOPE) continue;
    const existing = byKey.get(variable.key);
    if (existing && existing.environment === environment) continue;
    byKey.set(variable.key, variable);
  }
  return [...byKey.values()]
    .filter((variable) => !isEmptyCredentialPlaceholder(variable))
    .sort((left, right) => left.key.localeCompare(right.key));
}
