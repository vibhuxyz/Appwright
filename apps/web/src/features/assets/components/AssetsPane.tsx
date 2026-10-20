import { ImageOff, Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { useProjectAssets } from "../hooks/use-project-assets";

interface AssetsPaneProps {
  projectId: string;
}

export function AssetsPane({ projectId }: AssetsPaneProps) {
  const { data, isPending, isError, error, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useProjectAssets(projectId);

  if (isPending) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-rose-400">
        {error instanceof Error ? error.message : "Could not load assets."}
      </div>
    );
  }

  const items = data.pages.flatMap((page) => page.items);

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-muted">
        <ImageOff className="h-6 w-6" />
        <p className="text-sm">No images yet. They show up here once the chat asks for one.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-auto p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((asset) => (
          <figure key={asset.id} className="overflow-hidden rounded-lg border border-border-soft bg-surface-2">
            <img src={asset.url} alt={asset.altText} className="aspect-square w-full object-cover" />
            <figcaption className="flex items-center justify-between px-2 py-1.5 text-[11px] text-foreground-secondary">
              <span className="truncate">{asset.purpose}</span>
              <span className="shrink-0 text-muted">{asset.source === "GENERATED" ? "AI" : "Uploaded"}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      {hasNextPage && (
        <Button
          variant="secondary"
          size="sm"
          className="mx-auto"
          disabled={isFetchingNextPage}
          onClick={() => fetchNextPage()}
        >
          {isFetchingNextPage && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          <span>Load more</span>
        </Button>
      )}
    </div>
  );
}
