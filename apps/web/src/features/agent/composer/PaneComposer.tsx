import { ChatInput } from "../components/ChatInput";
import { PromptSuggestionBar } from "../components/PromptSuggestionBar";
import type { PromptQuality } from "../utils/evaluatePrompt";
import type { PromptSuggestion } from "../utils/promptSuggestions";

export function PaneComposer({
  input,
  trimmed,
  running,
  isEnhancing,
  enhancedSuccess,
  enhanceError,
  quality,
  tip,
  suggestions,
  canUndo,
  model,
  onUndo,
  onApplySuggestion,
  onModelChange,
  onChange,
  onSubmit,
  onEnhance,
  onStop,
}: {
  input: string;
  trimmed: string;
  running: boolean;
  isEnhancing: boolean;
  enhancedSuccess: boolean;
  enhanceError: string | null;
  quality: PromptQuality;
  tip: string;
  suggestions: PromptSuggestion[];
  canUndo: boolean;
  model: string | undefined;
  onUndo: () => void;
  onApplySuggestion: (appendText: string) => void;
  onModelChange: (model: string) => void;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onEnhance: () => void;
  onStop: () => void;
}) {
  return (
    <div className="mt-auto shrink-0">
      {trimmed.length > 0 && (
        <PromptSuggestionBar
          tip={tip}
          suggestions={suggestions}
          canUndo={canUndo}
          onUndo={onUndo}
          onApplySuggestion={onApplySuggestion}
        />
      )}
      <ChatInput
        input={input}
        running={running}
        isEnhancing={isEnhancing}
        enhancedSuccess={enhancedSuccess}
        enhanceError={enhanceError}
        quality={quality}
        model={model}
        onModelChange={onModelChange}
        onChange={onChange}
        onSubmit={onSubmit}
        onEnhance={onEnhance}
        onStop={onStop}
      />
    </div>
  );
}
