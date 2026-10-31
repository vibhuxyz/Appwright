import type { EffortLevel, ModelCategory } from "@repo/contracts";
import { HIGH_COMPLEXITY, LOW_CONFIDENCE, UI_FRONTIER_COMPLEXITY } from "./constants";
import type { AutoProfile, SelectModelInput } from "./types";

function isChat(intent: string | undefined): boolean {
  return intent === "chat";
}

function isHard(input: SelectModelInput): boolean {
  return (input.complexity ?? 0) >= HIGH_COMPLEXITY || (input.confidence ?? 1) < LOW_CONFIDENCE;
}

function baseTier(profile: AutoProfile, input: SelectModelInput): ModelCategory {
  if (profile === "testing" || profile === "handoff") return "efficient";
  if (isChat(input.intent) && !isHard(input)) return "efficient";
  if (profile === "auth" || profile === "integration") return "frontier";
  if (isHard(input)) return "frontier";
  if (profile === "ui" && (input.complexity ?? 0) >= UI_FRONTIER_COMPLEXITY) return "frontier";
  if (profile === "ui") return "standard";
  return "standard";
}

function applyEffort(tier: ModelCategory, effort: EffortLevel, profile: AutoProfile): ModelCategory {
  if (effort === "low") {
    if (profile === "auth" || profile === "integration") {
      return tier === "frontier" ? "standard" : tier;
    }
    if (tier === "frontier") return "standard";
    if (tier === "standard") return "efficient";
    return "efficient";
  }
  if (effort === "high") {
    if (profile === "testing" || profile === "handoff") return "efficient";
    if (tier === "efficient") return "standard";
    return "frontier";
  }
  return tier;
}

export function tierFor(input: SelectModelInput): ModelCategory {
  const effort = input.effort ?? "medium";
  return applyEffort(baseTier(input.profile, input), effort, input.profile);
}
