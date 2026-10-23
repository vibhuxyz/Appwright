import { Check, Loader2 } from "lucide-react";
import type { UnsplashPhoto } from "@repo/contracts";
import { UnsplashCredit } from "./UnsplashCredit";

interface PhotoPreviewProps {
  photo: UnsplashPhoto;
  isSelecting: boolean;
  onSelect: (photo: UnsplashPhoto) => void;
}

const PREVIEW_WIDTH = 480;

export function PhotoPreview({ photo, isSelecting, onSelect }: PhotoPreviewProps) {
  const previewHeight = Math.round((PREVIEW_WIDTH * photo.height) / photo.width);

  return (
    <figure className="mt-2 rounded-md border border-border-soft bg-surface-2 p-2" aria-label="Photo preview">
      <img
        src={photo.regularUrl}
        alt={photo.description ?? `Photo by ${photo.attribution.photographerName}`}
        width={PREVIEW_WIDTH}
        height={previewHeight}
        className="h-32 w-full rounded object-cover"
      />
      <figcaption className="mt-1.5 flex items-center justify-between gap-2">
        <UnsplashCredit attribution={photo.attribution} />
        <button
          type="button"
          disabled={isSelecting}
          onClick={() => onSelect(photo)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {isSelecting ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Check className="size-3.5" aria-hidden />}
          <span>Use this photo</span>
        </button>
      </figcaption>
    </figure>
  );
}
