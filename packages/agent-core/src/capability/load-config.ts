import { Capability } from "@repo/contracts";
import {
  CAPABILITY_ENV_KEYS,
  DEFAULT_CAPABILITY_MODELS,
  DEFAULT_FALLBACK_MODEL,
  FALLBACK_ENV_KEY,
} from "./constants";
import type { CapabilityConfig } from "./types";

type Env = Readonly<Record<string, string | undefined>>;

function nonBlank(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function loadCapabilityConfig(env: Env): CapabilityConfig {
  const entries = Capability.options.map((capability) => {
    const configured = nonBlank(env[CAPABILITY_ENV_KEYS[capability]]);
    return [capability, configured ?? DEFAULT_CAPABILITY_MODELS[capability]] as const;
  });
  return {
    models: Object.fromEntries(entries) as CapabilityConfig["models"],
    fallbackModel: nonBlank(env[FALLBACK_ENV_KEY]) ?? DEFAULT_FALLBACK_MODEL,
  };
}
