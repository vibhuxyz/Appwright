import { isConversationalMessage, looksLikeBuildRequest, type SuggestedPath } from "@repo/contracts";
import type { DecisionResult } from "../types";
import { MIN_CONFIDENCE_FOR_ROUTE } from "./constants";

export interface RouteSignals {
  hasBuiltApp: boolean;
  hasAttachments: boolean;
  isRepair: boolean;
}

function isBuildByKeywords(prompt: string): boolean {
  return !isConversationalMessage(prompt) && looksLikeBuildRequest(prompt);
}

function isConfident(result: DecisionResult): boolean {
  return result.status === "accepted" && result.decision.confidence >= MIN_CONFIDENCE_FOR_ROUTE;
}

export function fallbackPath(prompt: string, signals: RouteSignals): SuggestedPath {
  if (signals.isRepair || signals.hasBuiltApp) return "send-direct";
  return isBuildByKeywords(prompt) ? "plan" : "send-direct";
}

export function suggestPath(result: DecisionResult, signals: RouteSignals): SuggestedPath {
  if (signals.isRepair || !isConfident(result)) return "send-direct";
  const { intent } = result.decision;
  if (intent === "chat" && !signals.hasAttachments) return "reply";
  if (intent === "create" && !signals.hasBuiltApp) return "plan";
  return "send-direct";
}
