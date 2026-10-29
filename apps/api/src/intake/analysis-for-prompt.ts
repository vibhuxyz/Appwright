import { hashPrompt, isAnalysisFresh, type PromptAnalysis } from "@repo/contracts";

export async function analysisForPrompt(
  analysis: PromptAnalysis | undefined,
  turn: { prompt: string; hasPlanFeedback: boolean },
): Promise<PromptAnalysis | undefined> {
  if (!analysis) return undefined;
  const isFresh = isAnalysisFresh(analysis, { promptHash: await hashPrompt(turn.prompt), hasPlanFeedback: turn.hasPlanFeedback });
  return isFresh ? analysis : undefined;
}
