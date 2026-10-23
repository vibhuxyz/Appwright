import { Loader2 } from "lucide-react";
import type { UnsplashPhoto } from "@repo/contracts";
import { cn } from "@/shared/lib/cn";

interface PhotoResultsGridProps {
  photos: readonly UnsplashPhoto[];
  previewId: string | undefined;
  onPreview: (photo: UnsplashPhoto) => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}

function altFor(photo: UnsplashPhoto): string {
  return photo.description ?? `Photo by ${photo.attribution.photographerName}`;
}

export function PhotoResultsGrid({
  photos,
  previewId,
  onPreview,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: PhotoResultsGridProps) {
  return (
    <div>
      <ul className="grid grid-cols-3 gap-1.5" aria-label="Photo results">
        {photos.map((photo) => (
          <li key={photo.id}>
            <button
              type="button"
              aria-label={`Preview ${altFor(photo)}`}
              aria-pressed={photo.id === previewId}
              onClick={() => onPreview(photo)}
              className={cn(
                "block w-full overflow-hidden rounded-md border border-transparent transition outline-none focus-visible:border-primary",
                photo.id === previewId ? "border-primary" : "hover:border-border",
              )}
            >
              <img
                src={photo.smallUrl}
                alt={altFor(photo)}
                width={120}
                height={80}
                loading="lazy"
                className="aspect-3/2 w-full object-cover"
              />
            </button>
          </li>
        ))}
      </ul>
      {hasMore && (
        <button
          type="button"
          disabled={isLoadingMore}
          onClick={onLoadMore}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-border-soft bg-surface-2 px-2 py-1.5 text-[11px] text-foreground-secondary transition hover:bg-surface disabled:opacity-50"
        >
          {isLoadingMore && <Loader2 className="size-3 animate-spin" aria-hidden />}
          <span>More photos</span>
        </button>
      )}
    </div>
  );
}
