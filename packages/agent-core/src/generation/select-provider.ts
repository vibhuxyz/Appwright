import type { ModelResolution } from "../capability";
import type { Provider } from "../providers/types";

export type ProviderSelection =
  | {
      ok: true;
      provider: Provider;
      fellBackFrom?: { model: string; reason: string };
    }
  | { ok: false; message: string };

function reasonOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function tryCreate(
  createProvider: (model: string) => Provider,
  model: string,
): { provider: Provider } | { reason: string } {
  try {
    return { provider: createProvider(model) };
  } catch (error) {
    return { reason: reasonOf(error) };
  }
}

export function selectProvider(
  resolution: ModelResolution,
  createProvider: (model: string) => Provider,
): ProviderSelection {
  const primary = tryCreate(createProvider, resolution.model);
  if ("provider" in primary) return { ok: true, provider: primary.provider };
  if (resolution.fallbackModel === resolution.model) {
    return { ok: false, message: `Cannot create provider for ${resolution.model}: ${primary.reason}` };
  }
  const fallback = tryCreate(createProvider, resolution.fallbackModel);
  if ("reason" in fallback) {
    return {
      ok: false,
      message: `Cannot create provider for ${resolution.model} (${primary.reason}) or fallback ${resolution.fallbackModel} (${fallback.reason})`,
    };
  }
  return {
    ok: true,
    provider: fallback.provider,
    fellBackFrom: { model: resolution.model, reason: primary.reason },
  };
}
