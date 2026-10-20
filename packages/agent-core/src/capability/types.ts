import type { Capability } from "@repo/contracts";

export interface CapabilityConfig {
  readonly models: Readonly<Record<Capability, string>>;
  readonly fallbackModel: string;
}

export interface ModelResolution {
  readonly capability: Capability;
  readonly model: string;
  readonly fallbackModel: string;
}

export interface CapabilityRegistry {
  resolve(capability: Capability): ModelResolution;
}
