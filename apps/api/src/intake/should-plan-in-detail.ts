import { classify, needsDetailedPlan } from "@repo/decision-engine";
import {
  OpenAiProvider,
  bestAvailableModel,
  isProviderCreditsDepleted,
  providerFor,
  type Provider,
} from "@repo/agent-core";
import { log } from "../log";

export async function shouldPlanInDetail(
  prompt: string,
  provider: Provider = new OpenAiProvider({ model: bestAvailableModel() }),
): Promise<boolean> {
  const decisionResult = await classify(prompt, provider);
  // classify() never throws: a dead provider is status "provider_error".
  // needsDetailedPlan fails closed on that, which is right for skipping a
  // Blueprint DAG. Intake must not treat "we could not classify" as "this
  // is a tiny edit" — that returns questions: [] and the client starts a
  // build that dies on the same provider.
  if (decisionResult.status !== "accepted") {
    if (decisionResult.status === "provider_error") {
      log.error("shouldPlanInDetail classify call failed", {
        model: provider.model,
        provider: providerFor(provider.model),
        providerCreditsDepleted: isProviderCreditsDepleted(decisionResult.errorMessage ?? ""),
        message: decisionResult.errorMessage,
      });
    }
    return true;
  }
  return needsDetailedPlan(decisionResult);
}
