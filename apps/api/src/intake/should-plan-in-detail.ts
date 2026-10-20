import { classify, needsDetailedPlan } from "@repo/decision-engine";
import { OpenAiProvider, DEFAULT_MODEL, type Provider } from "@repo/agent-core";

export async function shouldPlanInDetail(
  prompt: string,
  provider: Provider = new OpenAiProvider({ model: DEFAULT_MODEL }),
): Promise<boolean> {
  const decisionResult = await classify(prompt, provider);
  return needsDetailedPlan(decisionResult);
}
