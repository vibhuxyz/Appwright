export const ANALYZE_PROMPT_VERSION = "analyze@1";

export const PROMPT_ANALYSIS_LIMITS = {
  maxHintFiles: 8,
  maxErrorLines: 8,
  maxErrorLineChars: 300,
  maxMentionedFeatures: 8,
  maxFeatureChars: 80,
  maxPathChars: 300,
} as const;

export const SUGGESTED_PATHS = ["reply", "send-direct", "plan"] as const;

export const ANALYSIS_INTENTS = ["chat", "create", "modify", "debug", "delete", "test", "unknown"] as const;
