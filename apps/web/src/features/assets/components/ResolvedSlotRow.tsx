import { useState } from "react";
import { Image as ImageIcon, Search } from "lucide-react";
import type { AssetSlot, UnsplashPhoto } from "@repo/contracts";
import { PhotoSearchPanel } from "./PhotoSearchPanel";
import { UnsplashCredit } from "./UnsplashCredit";

interface ResolvedSlotRowProps {
  slot: AssetSlot;
  isSelecting: boolean;
  error?: string;
  onSelectPhoto: (photo: UnsplashPhoto) => void;
}

function isHotlinked(path: string | undefined): path is string {
  return path !== undefined && path.startsWith("https://");
}

export function ResolvedSlotRow({ slot, isSelecting, error, onSelectPhoto }: ResolvedSlotRowProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const status = slot.status === "SKIPPED" ? "Using a matching photo" : "Added";

  return (
    <div className="rounded-lg border border-border-soft bg-surface-2 px-3 py-2 text-xs text-foreground-secondary">
      <div className="flex items-center gap-2">
        {isHotlinked(slot.finalPath) ? (
          <img src={slot.finalPath} alt="" width={36} height={36} className="size-9 shrink-0 rounded-md object-cover" />
        ) : (
          <ImageIcon className="size-3.5 shrink-0 text-info" aria-hidden />
        )}
        <span className="min-w-0 flex-1 truncate">{slot.altText}</span>
        <span className="shrink-0 text-muted">{status}</span>
        <button
          type="button"
          aria-expanded={isSearchOpen}
          aria-label={`Change photo for ${slot.altText}`}
          onClick={() => setIsSearchOpen((current) => !current)}
          className="flex shrink-0 items-center gap-1 rounded-md border border-border-soft bg-surface-3 px-2 py-1 text-[11px] transition hover:bg-surface"
        >
          <Search className="size-3" aria-hidden />
          <span>Change</span>
        </button>
      </div>
      {slot.attribution && <UnsplashCredit attribution={slot.attribution} />}
      {error && (
        <p className="mt-1 text-[11px] text-danger" role="alert">
          {error}
        </p>
      )}
      {isSearchOpen && (
        <PhotoSearchPanel
          inputId={`photo-search-${slot.id}`}
          initialQuery={slot.suggestedPrompt}
          isSelecting={isSelecting}
          onSelect={onSelectPhoto}
        />
      )}
    </div>
  );
}
