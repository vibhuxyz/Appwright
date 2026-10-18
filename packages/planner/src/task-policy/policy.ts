import {
  RISK_TIER_BY_TASK_TYPE,
  type Capability,
  type RiskTier,
  type TaskType,
  type VerificationPolicy,
} from "@repo/contracts";

const RISK_ORDER = [
  "low",
  "medium",
  "high",
] as const satisfies readonly RiskTier[];

const CAPABILITY_BY_TASK_TYPE = {
  scaffold: "cheap",
  theme: "cheap",
  schema: "strong_reasoning",
  auth: "strong_reasoning",
  payment: "strong_reasoning",
  migration: "strong_reasoning",
  api: "strong_coding",
  seed: "fast_coding",
  page: "fast_coding",
  component: "fast_coding",
} as const satisfies Record<TaskType, Capability>;

const VERIFICATION_TIER_BY_RISK = {
  low: 1,
  medium: 2,
  high: 3,
} as const satisfies Record<RiskTier, VerificationPolicy["tier"]>;

export function riskTierFor(type: TaskType, override?: RiskTier): RiskTier {
  const base = RISK_TIER_BY_TASK_TYPE[type];
  if (!override) return base;
  return RISK_ORDER.indexOf(override) > RISK_ORDER.indexOf(base)
    ? override
    : base;
}

export function capabilityFor(type: TaskType): Capability {
  return CAPABILITY_BY_TASK_TYPE[type];
}

export function verificationFor(riskTier: RiskTier): VerificationPolicy {
  return { tier: VERIFICATION_TIER_BY_RISK[riskTier] };
}
