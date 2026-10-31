import { Sparkles } from "lucide-react";
import { AUTO_MODEL } from "@repo/contracts";
import { cn } from "@/shared/lib/cn";

export function AutoRow({ isSelected, onSelect }: { isSelected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      onClick={onSelect}
      className={cn(
        "flex w-full cursor-pointer flex-col rounded-xl px-3 py-2 text-left transition-colors hover:bg-surface-2",
        isSelected && "bg-surface-2",
      )}
    >
      <div className="flex items-center gap-1.5">
        <Sparkles className="size-3.5 text-foreground" />
        <span className="text-[13px] font-medium text-foreground">{AUTO_MODEL.name}</span>
      </div>
      <span className="text-[11px] text-muted">{AUTO_MODEL.description}</span>
    </button>
  );
}
