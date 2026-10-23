import { AVAILABLE_MODELS, MODEL_CATEGORIES, modelCategory } from "@repo/contracts";
import { DEFAULT_MODEL, ENDPOINTS, providerFor } from "./openai";

type Env = NodeJS.Dict<string>;

function hasKeyFor(modelId: string, env: Env): boolean {
  const value = env[ENDPOINTS[providerFor(modelId)].envKey];
  return typeof value === "string" && value.length > 0;
}

// Planning calls (intent classification, blueprint content, intake
// questions) want the strongest reachable model, not whatever the user
// picked for chat — pick the best catalog entry whose provider actually has
// a key configured, falling back through frontier -> standard -> efficient.
export function bestAvailableModels(
  env: Env = process.env,
  isAllowed: (modelId: string) => boolean = () => true,
): string[] {
  const models: string[] = [];
  for (const category of MODEL_CATEGORIES) {
    for (const model of AVAILABLE_MODELS) {
      if (modelCategory(model) !== category || !isAllowed(model.id) || !hasKeyFor(model.id, env)) continue;
      if (!models.includes(model.id)) models.push(model.id);
    }
  }
  return models.length > 0 ? models : [DEFAULT_MODEL];
}

export function bestAvailableModel(
  env: Env = process.env,
  isAllowed: (modelId: string) => boolean = () => true,
): string {
  return bestAvailableModels(env, isAllowed)[0] ?? DEFAULT_MODEL;
}
