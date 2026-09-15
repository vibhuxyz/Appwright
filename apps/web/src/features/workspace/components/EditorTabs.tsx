import { File, MoreHorizontal, Plus, X } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export function EditorTabs({
  openFiles,
  selected,
  onSelect,
  onClose,
}: {
  openFiles: string[];
  selected: string | null;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
}) {
  return (
    <div className="flex h-13 shrink-0 items-center gap-1 border-b border-border-soft px-2">
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {openFiles.map((path) => {
          const active = path === selected;
          return (
            <div
              key={path}
              onClick={() => onSelect(path)}
              className={cn(
                "group flex h-[51px] shrink-0 cursor-pointer items-center gap-2 border-b-2 px-3 text-[13px] transition-colors",
                active
                  ? "border-pink text-foreground"
                  : "border-transparent text-muted hover:text-foreground-secondary",
              )}
            >
              <File className={cn("size-3.5", active ? "text-pink" : "text-muted")} />
              <span className="max-w-35 truncate">{path.split("/").pop()}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(path);
                }}
                className="cursor-pointer rounded p-0.5 text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
                title="Close tab"
              >
                <X className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        title="Open a file from the tree"
        className="grid size-7 shrink-0 cursor-default place-items-center rounded-md text-muted"
      >
        <Plus className="size-4" />
      </button>
      <button
        type="button"
        title="More"
        className="grid size-7 shrink-0 cursor-default place-items-center rounded-md text-muted"
      >
        <MoreHorizontal className="size-4" />
      </button>
    </div>
  );
}
