import { Lightbulb } from "lucide-react";
import type { PromptSuggestion } from "../utils/promptSuggestions";

export function PromptSuggestionBar({
  tip,
  suggestions,
  canUndo,
  onUndo,
  onApplySuggestion,
}: {
  tip: string;
  suggestions: PromptSuggestion[];
  canUndo: boolean;
  onUndo: () => void;
  onApplySuggestion: (appendText: string) => void;
}) {
  return (
    <div className="flex shrink-0 flex-col gap-2 border-t border-border-soft px-4 py-3 text-xs">
      <div className="flex items-start gap-2">
        <Lightbulb className="mt-px size-3.5 shrink-0 text-lime" />
        {/* The tip wraps instead of truncating — a half-shown tip is worse
            than no tip. */}
        <p className="flex-1 leading-relaxed text-foreground-secondary">{tip}</p>
        {canUndo && (
          <button
            type="button"
            onClick={onUndo}
            className="shrink-0 cursor-pointer text-[11px] text-muted underline transition-colors hover:text-foreground"
          >
            Undo
          </button>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onApplySuggestion(s.appendText)}
              title="Append this to your prompt"
              className="cursor-pointer rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-[11px] text-foreground-secondary transition-colors hover:bg-surface-3 hover:text-foreground"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
