import type { CapabilityConfig, CapabilityRegistry } from "./types";

export function createCapabilityRegistry(
  config: CapabilityConfig,
): CapabilityRegistry {
  return {
    resolve(capability) {
      return {
        capability,
        model: config.models[capability],
        fallbackModel: config.fallbackModel,
      };
    },
  };
}
