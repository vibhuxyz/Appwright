import { useRef, useState } from "react";
import { Image as ImageIcon, Loader2, Sparkles, Upload, X } from "lucide-react";
import type { AssetSlot } from "@repo/contracts";
import { GeneratePromptEditor } from "./GeneratePromptEditor";

const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/webp,image/gif";

interface AssetSlotRowProps {
  slot: AssetSlot;
  isUploading: boolean;
  isGenerating: boolean;
  isSkipping: boolean;
  error?: string;
  onUpload: (file: File) => void;
  onGenerate: (prompt: string) => void;
  onSkip: () => void;
}

export function AssetSlotRow({
  slot,
  isUploading,
  isGenerating,
  isSkipping,
  error,
  onUpload,
  onGenerate,
  onSkip,
}: AssetSlotRowProps) {
  const [isGeneratePanelOpen, setIsGeneratePanelOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isBusy = isUploading || isGenerating || isSkipping;

  if (slot.status === "RESOLVED" || slot.status === "SKIPPED") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border-soft bg-surface-2 px-3 py-2 text-xs text-foreground-secondary">
        <ImageIcon className="h-3.5 w-3.5 shrink-0 text-sky-400" />
        <span className="truncate">{slot.altText}</span>
        <span className="ml-auto shrink-0 text-muted">
          {slot.status === "SKIPPED" ? "Skipped" : "Added"}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border-soft bg-surface-2 p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-foreground">
        <ImageIcon className="h-3.5 w-3.5 shrink-0 text-sky-400" />
        <span className="truncate">{slot.altText}</span>
      </div>

      {error && <p className="mt-1.5 text-[11px] text-rose-400">{error}</p>}

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          className="hidden"
          aria-label={`Upload image for ${slot.altText}`}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUpload(file);
            event.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={isBusy}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg border border-border-soft bg-surface-3 px-3 py-1.5 text-xs font-medium text-foreground-secondary transition hover:bg-surface-4 disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          <span>Upload your own</span>
        </button>
        <button
          type="button"
          disabled={isBusy}
          onClick={() => setIsGeneratePanelOpen((open) => !open)}
          className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-sky-500 disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          <span>Generate with AI</span>
        </button>
        <button
          type="button"
          disabled={isBusy}
          onClick={onSkip}
          className="ml-auto flex items-center gap-1 text-[11px] text-muted transition hover:text-foreground-secondary disabled:opacity-50"
        >
          <X className="h-3 w-3" />
          <span>Skip</span>
        </button>
      </div>

      {isGeneratePanelOpen && (
        <GeneratePromptEditor
          initialPrompt={slot.suggestedPrompt}
          isPending={isGenerating}
          onGenerate={onGenerate}
        />
      )}
    </div>
  );
}
