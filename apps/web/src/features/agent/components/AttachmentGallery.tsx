import type { Attachment } from "@repo/contracts";
import { FileText, X } from "lucide-react";
import { useState } from "react";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ImageLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
    >
      <div
        className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-xl border border-border bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close image preview"
          className="absolute top-2 right-2 z-10 grid size-8 cursor-pointer place-items-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
        >
          <X className="size-4" />
        </button>
        <img src={src} alt={alt} className="max-h-[85vh] max-w-[85vw] object-contain" />
      </div>
    </div>
  );
}

export function AttachmentGallery({
  attachments,
}: {
  attachments: readonly Attachment[];
}) {
  const [activeImage, setActiveImage] = useState<string | null>(null);

  if (attachments.length === 0) return null;

  const images = attachments.filter((a) => a.type === "image");
  const documents = attachments.filter((a) => a.type !== "image");

  return (
    <div className="mt-2.5 flex flex-col gap-2">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img) => {
            const src = img.dataUrl ?? img.url;
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => src && setActiveImage(src)}
                className="group relative size-16 cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-black/40 transition hover:border-[#E3FC18]/60 focus:outline-none"
              >
                {src ? (
                  <img
                    src={src}
                    alt={img.name}
                    className="size-full object-cover transition duration-200 group-hover:scale-105"
                  />
                ) : (
                  <div className="grid size-full place-items-center text-xs text-muted">
                    IMG
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {documents.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-2.5 py-1.5 text-xs text-white/90 shadow-xs"
            >
              <div className="grid size-6 place-items-center rounded-md bg-[#E3FC18]/10 text-[#E3FC18]">
                <FileText className="size-3.5" />
              </div>
              <div className="flex flex-col min-w-0 max-w-44">
                <span className="truncate text-[11px] font-medium leading-tight">
                  {doc.name}
                </span>
                <span className="text-[10px] text-muted">
                  {formatBytes(doc.sizeBytes)}
                  {doc.pageCount ? ` · ${doc.pageCount}p` : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeImage && (
        <ImageLightbox
          src={activeImage}
          alt="Attachment preview"
          onClose={() => setActiveImage(null)}
        />
      )}
    </div>
  );
}
