import type { Stack } from "@repo/contracts";

export type Capability = "realtime" | "payments" | "fileStorage" | "search";

export type CapabilityChoice =
  | "websockets"
  | "razorpay"
  | "local-uploads"
  | "mongodb-text-index";

export interface ArchitectureDecision {
  capability: Capability;
  choice: CapabilityChoice;
  reason: string;
}

export interface FrozenArchitecture {
  stack: Readonly<Stack>;
  decisions: readonly ArchitectureDecision[];
}
