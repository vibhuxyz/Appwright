import type { Attachment, EffortLevel } from "@repo/contracts";
import { useRef, useState } from "react";
import type { PromptQuality } from "../utils/evaluatePrompt";
import { AttachmentList } from "./AttachmentList";
import { ChatInputControls } from "./ChatInputControls";
import { ChatTipsHeader } from "./ChatTipsHeader";
import { EnhancingDisplay } from "./EnhancingDisplay";

const PLACEHOLDERS = {
  running: "AI is working on your app… stop it anytime.",
  paused: "Getting your questions ready… you can type your next message.",
  idle: "Describe what you want to create, paste screenshots, or attach design references…",
} as const;

function placeholderFor(running: boolean, isPaused: boolean): string {
  if (running) return PLACEHOLDERS.running;
  return isPaused ? PLACEHOLDERS.paused : PLACEHOLDERS.idle;
}

export function ChatInput({
  input,
  running,
  isPaused = false,
  isEnhancing,
  enhancedSuccess,
  enhanceError,
  quality,
  model,
  effort,
  attachments = [],
  isUploading = false,
  uploadError = null,
  onModelChange,
  onEffortChange,
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
  running: boolean;
  isPaused?: boolean;
  isEnhancing: boolean;
  enhancedSuccess: boolean;
  enhanceError: string | null;
  quality: PromptQuality;
  model: string | undefined;
  effort: EffortLevel | undefined;
  attachments?: readonly Attachment[];
  isUploading?: boolean;
  uploadError?: string | null;
  onModelChange: (model: string) => void;
  onEffortChange: (effort: EffortLevel) => void;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onEnhance: () => void;
  onStopEnhance: () => void;
  onStop: () => void;
  onAddFiles?: (files: FileList | File[]) => void;
  onRemoveAttachment?: (id: string) => void;
  onPaste?: (e: React.ClipboardEvent) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const trimmed = input.trim();
  const canSubmit =
    Boolean(trimmed || attachments.length > 0) &&
    !isPaused &&
    !isEnhancing &&
    !isUploading &&
    Boolean(model);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && onAddFiles) {
      onAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && onAddFiles) {
      onAddFiles(e.target.files);
      e.target.value = "";
    }
  };

  return (
    <div className="shrink-0 border-t border-border-soft p-3">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col gap-2.5 rounded-2xl border p-3 transition-colors ${
          isDragging
            ? "border-[#E3FC18] bg-surface-3/60"
            : "border-border bg-surface-2 focus-within:border-surface-3"
        }`}
      >
        <ChatTipsHeader
          onEnhanceSpec={onEnhance}
          onStopEnhance={onStopEnhance}
          isEnhancing={isEnhancing}
          hasInput={Boolean(trimmed)}
          quality={quality}
        />

        {isEnhancing ? (
          <EnhancingDisplay text={input} />
        ) : (
          <textarea
            rows={Math.min(9, Math.max(3, input.split("\n").length))}
            className="max-h-56 min-h-18 w-full resize-none overflow-y-auto bg-transparent text-[13px] leading-relaxed text-foreground placeholder-muted outline-none"
            placeholder={placeholderFor(running, isPaused)}
            value={input}
            onChange={(e) => onChange(e.target.value)}
            onPaste={onPaste}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
          />
        )}

        <AttachmentList
          attachments={attachments}
          isUploading={isUploading}
          uploadError={uploadError}
          onRemove={onRemoveAttachment ?? (() => {})}
        />

        <ChatInputControls
          running={running}
          canSubmit={canSubmit}
          quality={quality}
          enhancedSuccess={enhancedSuccess}
          enhanceError={enhanceError}
          model={model}
          effort={effort}
          onAttachClick={() => fileInputRef.current?.click()}
          onModelChange={onModelChange}
          onEffortChange={onEffortChange}
          onSubmit={onSubmit}
          onStop={onStop}
        />
      </div>
    </div>
  );
}
