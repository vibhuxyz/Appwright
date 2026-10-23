import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Loader2, Search, Sparkles, Upload } from "lucide-react";
import type { AssetSlot, UnsplashPhoto } from "@repo/contracts";
import { cn } from "@/shared/lib/cn";
import { GeneratePromptEditor } from "./GeneratePromptEditor";
import { PhotoSearchPanel } from "./PhotoSearchPanel";
import { ResolvedSlotRow } from "./ResolvedSlotRow";

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg"];
const ACCEPT_ATTRIBUTE = "image/png,image/jpeg,.png,.jpg,.jpeg";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_EXTENSION = /\.(png|jpe?g)$/i;
const IMAGE_RULE = "Upload a PNG, JPEG, or JPG under 5 MB.";

interface AssetSlotRowProps {
  slot: AssetSlot;
  isUploading: boolean;
  isGenerating: boolean;
  isDeciding: boolean;
  isSelecting: boolean;
  error?: string;
  onUpload: (file: File) => void;
  onGenerate: (prompt: string) => void;
  onDecide: () => void;
  onSelectPhoto: (photo: UnsplashPhoto) => void;
}

function imageFileProblem(file: File): string | null {
  const typeOk =
    ACCEPTED_IMAGE_TYPES.includes(file.type) ||
    (file.type === "" && IMAGE_EXTENSION.test(file.name));
  if (!typeOk) return IMAGE_RULE;
  if (file.size > MAX_IMAGE_BYTES) return `That file is over 5 MB. ${IMAGE_RULE}`;
  return null;
}

export function AssetSlotRow({
  slot,
  isUploading,
  isGenerating,
  isDeciding,
  isSelecting,
  error,
  onUpload,
  onGenerate,
  onDecide,
  onSelectPhoto,
}: AssetSlotRowProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = useRef<string | null>(null);
  const [isGeneratePanelOpen, setIsGeneratePanelOpen] = useState(false);
  const [isPhotoPanelOpen, setIsPhotoPanelOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);
  const isBusy = isUploading || isGenerating || isDeciding || isSelecting;
  const shownError = localError ?? error;

  useEffect(() => {
    return () => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    };
  }, []);

  const takeFile = (file: File | undefined) => {
    if (!file || isBusy) return;
    const problem = imageFileProblem(file);
    if (problem) {
      setLocalError(problem);
      return;
    }
    setLocalError(null);
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    const url = URL.createObjectURL(file);
    previewUrl.current = url;
    setPreview({ url, name: file.name });
    onUpload(file);
  };

  if (slot.status === "RESOLVED" || slot.status === "SKIPPED") {
    return <ResolvedSlotRow slot={slot} isSelecting={isSelecting} error={error} onSelectPhoto={onSelectPhoto} />;
  }

  return (
    <div
      className={cn(
        "relative rounded-lg border border-dashed border-border-soft bg-surface-2 p-3",
        preview && "border-solid border-primary/40",
      )}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        takeFile(event.dataTransfer.files.item(0) ?? undefined);
      }}
    >
      <div className="flex items-center gap-2 text-xs font-medium text-foreground">
        {preview ? (
          <img
            src={preview.url}
            alt=""
            width={36}
            height={36}
            className="size-9 shrink-0 rounded-md object-cover"
          />
        ) : (
          <ImageIcon className="size-3.5 shrink-0 text-info" aria-hidden />
        )}
        <span className="min-w-0 truncate">{slot.altText}</span>
        <span className="ml-auto shrink-0 text-[11px] font-normal text-muted">
          {slot.required ? "Required" : "Optional"}
        </span>
      </div>
      <p className="mt-1 text-[11px] text-muted">
        {slot.pageRoute} · {slot.componentName} · {slot.purpose}
        {preview ? ` · ${preview.name}` : ""}
      </p>

      {slot.status === "FAILED" && !shownError && (
        <p className="mt-1.5 text-[11px] text-danger" role="alert">
          The last attempt failed. Upload, generate, or decide for me again.
        </p>
      )}
      {shownError && (
        <p className="mt-1.5 text-[11px] text-danger" role="alert">
          {shownError}
        </p>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={isBusy}
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg border border-border-soft bg-surface-3 px-3 py-1.5 text-xs font-medium text-foreground-secondary transition hover:bg-surface disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
          <span>{preview ? "Replace" : "Upload"}</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          disabled={isBusy}
          tabIndex={-1}
          aria-hidden
          className="absolute size-px opacity-0"
          onChange={(event) => {
            takeFile(event.target.files?.item(0) ?? undefined);
            event.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={isBusy}
          onClick={() => setIsGeneratePanelOpen((current) => !current)}
          aria-expanded={isGeneratePanelOpen}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
          <span>Generate</span>
        </button>
        <button
          type="button"
          disabled={isBusy}
          onClick={() => setIsPhotoPanelOpen((current) => !current)}
          aria-expanded={isPhotoPanelOpen}
          className="flex items-center gap-1.5 rounded-lg border border-border-soft bg-surface-3 px-3 py-1.5 text-xs font-medium text-foreground-secondary transition hover:bg-surface disabled:opacity-50"
        >
          {isSelecting ? <Loader2 className="size-3.5 animate-spin" /> : <Search className="size-3.5" />}
          <span>Search photos</span>
        </button>
        <button
          type="button"
          disabled={isBusy}
          onClick={onDecide}
          className="ml-auto text-[11px] text-muted transition hover:text-foreground-secondary disabled:opacity-50"
        >
          {isDeciding ? "Picking a photo…" : "Decide for me"}
        </button>
      </div>

      {isPhotoPanelOpen && (
        <PhotoSearchPanel
          inputId={`photo-search-${slot.id}`}
          initialQuery={slot.suggestedPrompt}
          isSelecting={isSelecting}
          onSelect={onSelectPhoto}
        />
      )}

      {isGeneratePanelOpen && (
        <GeneratePromptEditor
          inputId={`asset-prompt-${slot.id}`}
          initialPrompt={slot.suggestedPrompt}
          isPending={isGenerating}
          onGenerate={onGenerate}
        />
      )}
    </div>
  );
}
