export type PromptQuality = "needs_detail" | "medium" | "high" | null;

export interface PromptEvaluation {
  wordCount: number;
  isShort: boolean;
  quality: PromptQuality;
  tip: string;
}

export function evaluatePrompt(trimmed: string, enhancedSuccess: boolean): PromptEvaluation {
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const isShort = trimmed.length > 0 && (trimmed.length < 55 || wordCount < 8);
  const isVideoApp = /video|youtube|coach|channel|stream/i.test(trimmed);
  const isTodoApp = /todo|task|manage|list/i.test(trimmed);

  const quality: PromptQuality =
    trimmed.length === 0
      ? null
      : isShort
        ? "needs_detail"
        : wordCount > 25 || enhancedSuccess
          ? "high"
          : "medium";

  // Tips are read mid-typing, so they stay one short line and name the next
  // thing to add — never a paragraph the input has to truncate.
  const tip = isVideoApp
    ? "Name the video IDs, the search behaviour and what Esc closes."
    : isTodoApp
      ? "Say which status tabs, live counts and shortcuts you want."
      : isShort
        ? "Short prompt — Enhance Prompt expands it into a full spec."
        : quality === "high"
          ? "Well specified. Send it, or add a detail below."
          : "Good start. Add data, layout or interaction details.";

  return { wordCount, isShort, quality, tip };
}

export const PROMPT_QUALITY_LABEL: Record<Exclude<PromptQuality, null>, string> = {
  needs_detail: "Needs detail",
  high: "Well specified",
  medium: "Moderate",
};

export const PROMPT_QUALITY_TONE: Record<
  Exclude<PromptQuality, null>,
  "warning" | "success" | "accent"
> = {
  needs_detail: "warning",
  high: "success",
  medium: "accent",
};
