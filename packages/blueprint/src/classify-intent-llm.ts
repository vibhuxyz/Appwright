import { DEFAULT_MODEL, OpenAiProvider, readProviderText, type Provider } from "@repo/agent-core";
import { buildIntentPrompt, extractJsonObject } from "@repo/planner";

const MAX_OUTPUT_BYTES = 2_000;

export function createIntentClassifier(provider?: Provider) {
  const resolved = provider ?? new OpenAiProvider({ model: DEFAULT_MODEL });
  return async (prompt: string, signal: AbortSignal): Promise<unknown> => {
    const raw = await readProviderText(resolved, buildIntentPrompt(prompt), signal, MAX_OUTPUT_BYTES);
    return extractJsonObject(raw);
  };
}
