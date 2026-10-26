import { classify, isNewBuildRequest } from "@repo/decision-engine";
import {
  OpenAiProvider,
  bestAvailableModel,
  isProviderCreditsDepleted,
  providerFor,
  type Provider,
} from "@repo/agent-core";
import { log } from "../log";

export async function isNewAppRequest(
  prompt: string,
  provider: Provider = new OpenAiProvider({ model: bestAvailableModel() }),
): Promise<boolean> {
  const decisionResult = await classify(prompt, provider);
  if (decisionResult.status !== "accepted") {
    if (decisionResult.status === "provider_error") {
      log.error("isNewAppRequest classify call failed", {
        model: provider.model,
        provider: providerFor(provider.model),
        providerCreditsDepleted: isProviderCreditsDepleted(decisionResult.errorMessage ?? ""),
        message: decisionResult.errorMessage,
      });
    }
    return true;
  }
  return isNewBuildRequest(decisionResult);
}
