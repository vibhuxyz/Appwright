import { z } from "zod";
import { ANALYSIS_INTENTS, PROMPT_ANALYSIS_LIMITS, SUGGESTED_PATHS } from "./constants";

const LIMITS = PROMPT_ANALYSIS_LIMITS;

export const AnalysisIntentSchema = z.enum(ANALYSIS_INTENTS);
export const SuggestedPathSchema = z.enum(SUGGESTED_PATHS);

export const ErrorHintFileSchema = z.object({
  path: z.string().min(1).max(LIMITS.maxPathChars),
  line: z.number().int().positive().optional(),
});

export const ExtractedHintsSchema = z.object({
  files: z.array(ErrorHintFileSchema).max(LIMITS.maxHintFiles),
  errorLines: z.array(z.string().max(LIMITS.maxErrorLineChars)).max(LIMITS.maxErrorLines),
  mentionedFeatures: z.array(z.string().max(LIMITS.maxFeatureChars)).max(LIMITS.maxMentionedFeatures),
});

export const PromptAnalysisSchema = z.object({
  intent: AnalysisIntentSchema,
  confidence: z.number().min(0).max(1),
  complexity: z.number().min(0).max(10),
  ambiguity: z.number().min(0).max(10),
  needsQuestions: z.boolean(),
  suggestedPath: SuggestedPathSchema,
  extractedHints: ExtractedHintsSchema,
  source: z.enum(["model", "fallback"]),
  promptHash: z.string().regex(/^[0-9a-f]{64}$/),
  promptVersion: z.string().min(1).max(40),
});

export type AnalysisIntent = z.infer<typeof AnalysisIntentSchema>;
export type SuggestedPath = z.infer<typeof SuggestedPathSchema>;
export type ErrorHintFile = z.infer<typeof ErrorHintFileSchema>;
export type ExtractedHints = z.infer<typeof ExtractedHintsSchema>;
export type PromptAnalysis = z.infer<typeof PromptAnalysisSchema>;
