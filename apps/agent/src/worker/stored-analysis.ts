import {
  hashPrompt,
  hasPlanFeedbackData,
  isAnalysisFresh,
  PromptAnalysisSchema,
  type PromptAnalysis,
} from "@repo/contracts";
import { isIntakeTurn } from "./current-turn-text";

interface TurnRow {
  role: string;
  content: string;
  data: unknown;
}

export async function freshStoredAnalysis(
  stored: unknown,
  turnRows: readonly TurnRow[],
): Promise<PromptAnalysis | undefined> {
  const parsed = PromptAnalysisSchema.safeParse(stored);
  const userRow = turnRows.find((row) => row.role === "user" && !isIntakeTurn(row));
  if (!parsed.success || !userRow) return undefined;
  const signals = { promptHash: await hashPrompt(userRow.content), hasPlanFeedback: turnRows.some((row) => hasPlanFeedbackData(row.data)) };
  return isAnalysisFresh(parsed.data, signals) ? parsed.data : undefined;
}
