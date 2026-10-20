import type { Capability } from "@repo/contracts";

export const DEFAULT_FALLBACK_MODEL = "gpt-5.4-mini";

export const DEFAULT_CAPABILITY_MODELS = {
  strong_reasoning: "gpt-5.4",
  strong_coding: "gpt-5.2-codex",
  fast_coding: "gpt-5.4-mini",
  cheap: "gpt-4o-mini",
} as const satisfies Record<Capability, string>;

export const CAPABILITY_ENV_KEYS = {
  strong_reasoning: "CAPABILITY_MODEL_STRONG_REASONING",
  strong_coding: "CAPABILITY_MODEL_STRONG_CODING",
  fast_coding: "CAPABILITY_MODEL_FAST_CODING",
  cheap: "CAPABILITY_MODEL_CHEAP",
} as const satisfies Record<Capability, string>;

export const FALLBACK_ENV_KEY = "CAPABILITY_FALLBACK_MODEL";
