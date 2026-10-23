import { useState } from "react";
import { Search } from "lucide-react";
import type { UnsplashOrientation, UnsplashPhoto } from "@repo/contracts";
import { usePhotoSearch } from "../hooks/use-photo-search";
import { PhotoPreview } from "./PhotoPreview";
import { PhotoResultsGrid } from "./PhotoResultsGrid";
import { PhotoSearchStatus } from "./PhotoSearchStatus";

interface PhotoSearchPanelProps {
  inputId: string;
  initialQuery: string;
  isSelecting: boolean;
  onSelect: (photo: UnsplashPhoto) => void;
}

const ORIENTATIONS: readonly { value: UnsplashOrientation | ""; label: string }[] = [
  { value: "", label: "Any shape" },
  { value: "landscape", label: "Landscape" },
  { value: "portrait", label: "Portrait" },
  { value: "squarish", label: "Square" },
];

function isOrientation(value: string): value is UnsplashOrientation {
  return ORIENTATIONS.some((option) => option.value === value && value !== "");
}

export function PhotoSearchPanel({ inputId, initialQuery, isSelecting, onSelect }: PhotoSearchPanelProps) {
  const [text, setText] = useState(initialQuery);
  const [orientation, setOrientation] = useState<UnsplashOrientation | undefined>();
  const [previewed, setPreviewed] = useState<UnsplashPhoto | undefined>();
  const search = usePhotoSearch(text, orientation);
  const photos = search.data?.pages.flatMap((page) => page.items) ?? [];
  const isLoading = search.isWaitingForTyping || (search.isFetching && !search.isFetchingNextPage && photos.length === 0);

  return (
    <div className="mt-2.5 rounded-lg border border-border-soft bg-surface-3 p-2.5">
      <label htmlFor={inputId} className="text-[11px] font-medium text-foreground-secondary">
        Search Unsplash photos
      </label>
      <div className="mt-1 flex gap-1.5">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-2 left-2 size-3.5 text-muted" aria-hidden />
          <input
            id={inputId}
            type="search"
            value={text}
            maxLength={120}
            onChange={(event) => setText(event.target.value)}
            className="w-full rounded-md border border-border-soft bg-surface-2 py-1.5 pr-2 pl-7 text-xs text-foreground outline-none focus:border-primary"
          />
        </div>
        <select
          aria-label="Photo shape"
          value={orientation ?? ""}
          onChange={(event) => setOrientation(isOrientation(event.target.value) ? event.target.value : undefined)}
          className="rounded-md border border-border-soft bg-surface-2 px-1.5 text-xs text-foreground outline-none focus:border-primary"
        >
          {ORIENTATIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {previewed && <PhotoPreview photo={previewed} isSelecting={isSelecting} onSelect={onSelect} />}

      <div className="mt-2 max-h-40 overflow-y-auto pr-1" aria-live="polite">
        <PhotoSearchStatus
          isLoading={isLoading}
          error={search.error}
          isEmpty={search.isSuccess && photos.length === 0}
          query={search.query}
        />
        {photos.length > 0 && (
          <PhotoResultsGrid
            photos={photos}
            previewId={previewed?.id}
            onPreview={setPreviewed}
            hasMore={search.hasNextPage}
            isLoadingMore={search.isFetchingNextPage}
            onLoadMore={() => search.fetchNextPage()}
          />
        )}
      </div>
    </div>
  );
}
