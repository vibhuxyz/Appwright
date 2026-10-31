import type { EffortLevel } from "@repo/contracts";

export const EFFORT_LEVELS = ["low", "medium", "high"] as const satisfies readonly EffortLevel[];
export const EFFORT_LABEL: Record<EffortLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};
