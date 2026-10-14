import { RotateCw, Search } from "lucide-react";

interface PreviewAddressBarProps {
  url: string | null;
  onReload: () => void;
}

export function PreviewAddressBar({ url, onReload }: PreviewAddressBarProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5">
      <div className="flex h-9 flex-1 items-center gap-2 rounded-lg border border-border-soft bg-surface-2 px-3">
        <Search className="size-3.5 shrink-0 text-muted" />
        <span className="truncate text-[13px] text-foreground-secondary">
          {url ?? "waiting for the dev server…"}
        </span>
      </div>
      <button
        type="button"
        onClick={onReload}
        disabled={!url}
        title="Reload preview"
        className="grid size-9 cursor-pointer place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      >
        <RotateCw className="size-4" />
      </button>
    </div>
  );
}
