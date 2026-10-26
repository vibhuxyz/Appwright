export const QUESTION_SET_KINDS = ["agent", "intake", "integration", "images", "theme"] as const;

export const QUESTION_REPLY_OUTCOMES = ["answered", "skipped"] as const;

export const QUESTION_TRANSCRIPT_LIMITS = {
  maxItems: 24,
  maxKeyChars: 64,
  maxIntroChars: 280,
  maxLabelChars: 40,
  maxTextChars: 280,
  maxOptions: 12,
  maxOptionChars: 80,
  maxAnswerChars: 500,
  maxContentBytes: 6000,
} as const;

export const SKIPPED_REPLY_TEXT = "User skipped";
