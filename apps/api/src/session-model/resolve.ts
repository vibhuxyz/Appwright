export const FIRST_USE_MODEL = "claude-sonnet-5-5";

export interface ResolveNewSessionModelInput {
  lastUsedModel: string | null;
  defaultModel: string;
  isConfigured: (model: string) => boolean;
}

export function resolveNewSessionModel(input: ResolveNewSessionModelInput): string {
  const { lastUsedModel, defaultModel, isConfigured } = input;
  if (lastUsedModel && isConfigured(lastUsedModel)) return lastUsedModel;
  if (isConfigured(FIRST_USE_MODEL)) return FIRST_USE_MODEL;
  return defaultModel;
}
