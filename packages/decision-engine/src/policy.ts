import type { PromptAnalysis } from "@repo/contracts";
import type { DecisionResult, ExecutionMode } from "./types";

// Still not a general policy engine — project/component-level config has no
// second caller yet to prove that shape out. This is five rules, evaluated
// in order, against the fields classify() now returns.
export function resolvePolicy(result: DecisionResult): ExecutionMode {
  // Fail closed on the status first — a placeholder Decision from a parse
  // failure or provider error must never reach the rules below as if it
  // were a real classification.
  if (result.status !== "accepted") return "review";

  const { decision } = result;

  // The one combination this slice treats as never safe to run at all.
  if (decision.intent === "delete" && decision.changeType === "database") {
    return "blocked";
  }

  if (
    decision.risk === "high" ||
    decision.changeType === "database" ||
    decision.route === "database" ||
    decision.ambiguity >= 8 ||
    decision.confidence < 0.5
  ) {
    return "review";
  }

  if (decision.intent === "test") return "tool";

  // "direct" additionally requires route "none" — a change that touches a
  // real system layer (frontend/backend/database/devops) goes through the
  // agent even if it looks low-risk, because routing means more than one
  // file is plausibly involved.
  if (
    decision.route === "none" &&
    decision.risk === "low" &&
    decision.complexity < 3 &&
    decision.confidence >= 0.9
  ) {
    return "direct";
  }

  return "agent";
}

// Threshold a prompt's complexity must clear before it's worth the extra
// round trip of building a Blueprint and task DAG up front, rather than
// just handing the agent a single-pass loop.
const MIN_COMPLEXITY_FOR_PLAN = 6;
const MIN_CONFIDENCE_FOR_INTENT = 0.5;

export function isChatRequest(result: DecisionResult): boolean {
  if (result.status !== "accepted") return false;
  return result.decision.intent === "chat" && result.decision.confidence >= MIN_CONFIDENCE_FOR_INTENT;
}

export function isNewBuildRequest(result: DecisionResult): boolean {
  if (result.status !== "accepted") return false;
  return result.decision.intent === "create" && result.decision.confidence >= MIN_CONFIDENCE_FOR_INTENT;
}

// Whether this request is substantial enough to plan in detail first
// (Blueprint → task DAG → multi-task run) instead of a single agent pass.
// Same fail-closed rule as resolvePolicy: anything other than a confident,
// accepted "create" reads as "no plan" and falls through to the existing
// single-pass path, which already handles everything safely.
export function analysisNeedsDetailedPlan(analysis: PromptAnalysis): boolean {
  return (
    analysis.intent === "create" &&
    analysis.complexity >= MIN_COMPLEXITY_FOR_PLAN &&
    analysis.confidence >= MIN_CONFIDENCE_FOR_INTENT
  );
}

export function needsDetailedPlan(result: DecisionResult): boolean {
  if (result.status !== "accepted") return false;
  const { decision } = result;
  return (
    decision.intent === "create" &&
    decision.complexity >= MIN_COMPLEXITY_FOR_PLAN &&
    decision.confidence >= 0.5
  );
}
