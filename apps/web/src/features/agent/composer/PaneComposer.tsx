import type { Attachment } from "@repo/contracts";
import { ChatInput } from "../components/ChatInput";
import { PromptSuggestionBar } from "../components/PromptSuggestionBar";
import type { PromptQuality } from "../utils/evaluatePrompt";
import type { PromptSuggestion } from "../utils/promptSuggestions";

export function PaneComposer({
  input,
  trimmed,
  running,
  isPaused = false,
  isEnhancing,
  enhancedSuccess,
  enhanceError,
  quality,
  tip,
  suggestions,
  canUndo,
  model,
  attachments = [],
  isUploading = false,
  uploadError = null,
  onUndo,
  onApplySuggestion,
  onModelChange,
  onChange,
  onSubmit,
  onEnhance,
  onStopEnhance,
  onStop,
  onAddFiles,
  onRemoveAttachment,
  onPaste,
}: {
  input: string;
  trimmed: string;
  running: boolean;
  isPaused?: boolean;
  isEnhancing: boolean;
  enhancedSuccess: boolean;
  enhanceError: string | null;
  quality: PromptQuality;
  tip: string;
  suggestions: PromptSuggestion[];
  canUndo: boolean;
  model: string | undefined;
  attachments?: readonly Attachment[];
  isUploading?: boolean;
  uploadError?: string | null;
  onUndo: () => void;
  onApplySuggestion: (appendText: string) => void;
  onModelChange: (model: string) => void;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onEnhance: () => void;
  onStopEnhance: () => void;
  onStop: () => void;
  onAddFiles?: (files: FileList | File[]) => void;
  onRemoveAttachment?: (id: string) => void;
  onPaste?: (e: React.ClipboardEvent) => void;
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
        isPaused={isPaused}
        isEnhancing={isEnhancing}
        enhancedSuccess={enhancedSuccess}
        enhanceError={enhanceError}
        quality={quality}
        model={model}
        attachments={attachments}
        isUploading={isUploading}
        uploadError={uploadError}
        onModelChange={onModelChange}
        onChange={onChange}
        onSubmit={onSubmit}
        onEnhance={onEnhance}
        onStopEnhance={onStopEnhance}
        onStop={onStop}
        onAddFiles={onAddFiles}
        onRemoveAttachment={onRemoveAttachment}
        onPaste={onPaste}
      />
    </div>
  );
}
