import type { Provider } from "@repo/agent-core";
import { isChatRequest, isNewBuildRequest } from "@repo/decision-engine";
import { isConversationalMessage } from "./is-conversational-message";
import { classifyLogged, isBuildByKeywords, isClassifierUnavailable } from "./is-new-app-request";

export type PromptKind = "chat" | "new-app" | "other";

export function kindWithoutModel(prompt: string): PromptKind {
  return isConversationalMessage(prompt) ? "chat" : "other";
}

export async function promptKind(prompt: string, provider: Provider): Promise<PromptKind> {
  if (isConversationalMessage(prompt)) return "chat";
  const result = await classifyLogged(prompt, provider);
  if (isClassifierUnavailable(result)) return isBuildByKeywords(prompt) ? "new-app" : "other";
  if (isChatRequest(result)) return "chat";
  return isNewBuildRequest(result) ? "new-app" : "other";
}
