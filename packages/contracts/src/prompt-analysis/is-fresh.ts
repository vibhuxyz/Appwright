import { ANALYZE_PROMPT_VERSION } from "./constants";
import type { PromptAnalysis } from "./schema";

export interface AnalysisFreshnessSignals {
  promptHash: string;
  hasPlanFeedback: boolean;
}

export function isAnalysisFresh(analysis: PromptAnalysis, signals: AnalysisFreshnessSignals): boolean {
  return (
    analysis.promptVersion === ANALYZE_PROMPT_VERSION &&
    analysis.promptHash === signals.promptHash &&
    !signals.hasPlanFeedback
  );
}
