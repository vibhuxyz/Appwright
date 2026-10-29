import type { Provider } from "@repo/agent-core";
import {
  ANALYZE_PROMPT_VERSION,
  PROMPT_ANALYSIS_LIMITS,
  hashPrompt,
  isRepairPrompt,
  type PromptAnalysis,
  type SuggestedPath,
} from "@repo/contracts";
import { z } from "zod";
import { readDecision } from "../classify";
import type { DecisionResult } from "../types";
import { buildAnalyzePrompt } from "./build-analyze-prompt";
import { ANALYZE_TIMEOUT_MS } from "./constants";
import { extractErrorHints } from "./extract-error-hints";
import { fallbackPath, suggestPath, type RouteSignals } from "./suggest-path";
import type { AnalyzeInput } from "./types";

export interface PromptAnalysisReading {
  analysis: PromptAnalysis;
  result: DecisionResult;
}

const FeaturesSchema = z.object({ features: z.array(z.string()) });

function mentionedFeatures(json: unknown): string[] {
  const parsed = FeaturesSchema.safeParse(json);
  if (!parsed.success) return [];
  return parsed.data.features
    .map((feature) => feature.replace(/\s+/g, " ").trim().slice(0, PROMPT_ANALYSIS_LIMITS.maxFeatureChars))
    .filter((feature) => feature.length > 0)
    .slice(0, PROMPT_ANALYSIS_LIMITS.maxMentionedFeatures);
}

function isClassifierUnavailable(result: DecisionResult): boolean {
  return result.status === "provider_error" || result.status === "invalid";
}

function chosenPath(prompt: string, result: DecisionResult, signals: RouteSignals): SuggestedPath {
  return isClassifierUnavailable(result) ? fallbackPath(prompt, signals) : suggestPath(result, signals);
}

export async function analyzePrompt(
  input: AnalyzeInput,
  provider: Provider,
  signal: AbortSignal = AbortSignal.timeout(ANALYZE_TIMEOUT_MS),
): Promise<PromptAnalysisReading> {
  const [reading, promptHash] = await Promise.all([
    readDecision(buildAnalyzePrompt(input), provider, signal),
    hashPrompt(input.prompt),
  ]);
  const { result } = reading;
  const isRepair = isRepairPrompt(input.prompt);
  const suggestedPath = chosenPath(input.prompt, result, { ...input, isRepair });
  const intent = isRepair && result.decision.intent === "unknown" ? "debug" : result.decision.intent;
  const analysis: PromptAnalysis = {
    intent,
    confidence: result.decision.confidence,
    complexity: result.decision.complexity,
    ambiguity: result.decision.ambiguity,
    needsQuestions: suggestedPath === "plan",
    suggestedPath,
    extractedHints: { ...extractErrorHints(input.prompt), mentionedFeatures: mentionedFeatures(reading.json) },
    source: isClassifierUnavailable(result) ? "fallback" : "model",
    promptHash,
    promptVersion: ANALYZE_PROMPT_VERSION,
  };
  return { analysis, result };
}
