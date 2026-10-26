import type { Attachment } from "@repo/contracts";
import { FileText, Loader2, X } from "lucide-react";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentList({
  attachments,
  isUploading,
  uploadError,
  onRemove,
}: {
  attachments: readonly Attachment[];
  isUploading: boolean;
  uploadError: string | null;
  onRemove: (id: string) => void;
}) {
  if (attachments.length === 0 && !isUploading && !uploadError) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 px-1 pt-1">
      {attachments.map((att) => (
        <div
          key={att.id}
          className="group relative flex items-center gap-2 rounded-xl border border-border-soft bg-surface px-2.5 py-1.5 text-xs text-foreground shadow-xs transition-colors hover:border-border"
        >
          {att.type === "image" && att.dataUrl ? (
            <img
              src={att.dataUrl}
              alt={att.name}
              className="size-7 rounded-md object-cover"
            />
          ) : (
            <div className="grid size-7 place-items-center rounded-md bg-surface-2 text-[#E3FC18]">
              <FileText className="size-4" />
            </div>
          )}

          <div className="flex flex-col min-w-0 max-w-36">
            <span className="truncate text-[11px] font-medium leading-tight">
              {att.name}
            </span>
            <span className="text-[10px] text-muted">
              {formatBytes(att.sizeBytes)}
              {att.pageCount ? ` · ${att.pageCount}p` : ""}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onRemove(att.id ?? att.name)}
            title="Remove attachment"
            className="grid size-5 cursor-pointer place-items-center rounded-full text-muted transition-colors hover:bg-surface-3 hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        </div>
      ))}

      {isUploading && (
        <div className="flex items-center gap-1.5 rounded-xl border border-border-soft bg-surface px-2.5 py-1.5 text-xs text-muted">
          <Loader2 className="size-3.5 animate-spin text-[#E3FC18]" />
          <span className="text-[11px]">Uploading…</span>
        </div>
      )}

      {uploadError && (
        <span className="text-[11px] font-medium text-danger">
          {uploadError}
        </span>
      )}
    </div>
  );
}
