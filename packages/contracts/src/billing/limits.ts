import { creditsToUsd } from "./credits";

const MS_PER_MINUTE = 60_000;

export const AGENT_LOOP_LIMITS = {
  maxTokens: 2_000_000,
  maxCostUsd: 5,
  maxTaskCostUsd: 2,
  maxIterations: 250,
  loopDeadlineMs: 30 * MS_PER_MINUTE,
  wallClockCapMs: 45 * MS_PER_MINUTE,
  maxTaskIterations: 60,
  taskDeadlineMs: 10 * MS_PER_MINUTE,
} as const;

export const LOOP_DEADLINE_MINUTES = AGENT_LOOP_LIMITS.loopDeadlineMs / MS_PER_MINUTE;

export interface LoopSpendLimits {
  maxTokens: number;
  maxCostUsd: number;
}

export function loopSpendLimits(credits: number): LoopSpendLimits {
  return {
    maxTokens: AGENT_LOOP_LIMITS.maxTokens,
    maxCostUsd: Math.min(AGENT_LOOP_LIMITS.maxCostUsd, creditsToUsd(credits)),
  };
}
