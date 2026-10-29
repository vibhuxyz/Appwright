import { ANALYZE_PROMPT_VERSION, hashPrompt, type PromptAnalysis } from "@repo/contracts";

export async function analysisForPrompt(
  analysis: PromptAnalysis | undefined,
  prompt: string,
): Promise<PromptAnalysis | undefined> {
  if (!analysis || analysis.promptVersion !== ANALYZE_PROMPT_VERSION) return undefined;
  return analysis.promptHash === (await hashPrompt(prompt)) ? analysis : undefined;
}
