import { FileCode } from "lucide-react";
import type { DiffFile } from "@/features/agent/schemas/agentSchemas";

interface DiffFileListProps {
  diffs: DiffFile[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

export function DiffFileList({
  diffs,
  selectedPath,
  onSelect,
}: DiffFileListProps) {
  if (diffs.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-muted">
        No changes vs main
      </div>
    );
  }

  return (
    <div className="w-64 shrink-0 overflow-y-auto border-r border-border-soft bg-surface-2 p-2">
      {diffs.map((file) => {
        const active = file.path === selectedPath;
        return (
          <button
            key={file.path}
            type="button"
            onClick={() => onSelect(file.path)}
            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
              active
                ? "bg-surface-3 font-medium text-foreground"
                : "text-foreground-secondary hover:bg-surface-3"
            }`}
          >
            <div className="flex items-center gap-1.5 truncate">
              <FileCode className="size-3.5 shrink-0 text-muted" />
              <span className="truncate">{file.path}</span>
            </div>
            <div className="flex shrink-0 items-center gap-1 font-mono text-[10px]">
              <span className="text-emerald-400">+{file.additions}</span>
              <span className="text-rose-400">-{file.deletions}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
