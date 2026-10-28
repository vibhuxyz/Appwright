import { classify, isNewBuildRequest, type DecisionResult } from "@repo/decision-engine";
import {
  OpenAiProvider,
  bestAvailableModel,
  isProviderCreditsDepleted,
  providerFor,
  type Provider,
} from "@repo/agent-core";
import { log } from "../log";
import { isConversationalMessage, looksLikeBuildRequest } from "./is-conversational-message";

export function isClassifierUnavailable(result: DecisionResult): boolean {
  return result.status === "provider_error" || result.status === "invalid";
}

export function isBuildByKeywords(prompt: string): boolean {
  return !isConversationalMessage(prompt) && looksLikeBuildRequest(prompt);
}

export async function classifyLogged(prompt: string, provider: Provider): Promise<DecisionResult> {
  const decisionResult = await classify(prompt, provider);
  if (decisionResult.status === "provider_error") {
    log.error("isNewAppRequest classify call failed", {
      model: provider.model,
      provider: providerFor(provider.model),
      providerCreditsDepleted: isProviderCreditsDepleted(decisionResult.errorMessage ?? ""),
      message: decisionResult.errorMessage,
    });
  }
  return decisionResult;
}

export async function isNewAppRequest(
  prompt: string,
  provider: Provider = new OpenAiProvider({ model: bestAvailableModel() }),
): Promise<boolean> {
  const decisionResult = await classifyLogged(prompt, provider);
  if (isClassifierUnavailable(decisionResult)) return isBuildByKeywords(prompt);
  return isNewBuildRequest(decisionResult);
}
