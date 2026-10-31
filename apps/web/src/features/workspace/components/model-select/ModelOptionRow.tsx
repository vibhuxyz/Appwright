import { Info, Lock } from "lucide-react";
import { requiredPlanFor } from "@repo/contracts";
import type { AvailableModel } from "@/features/agent/schemas/agentSchemas";
import { cn } from "@/shared/lib/cn";

export function ModelOptionRow({
  item,
  isSelected,
  isLocked,
  onSelect,
}: {
  item: AvailableModel;
  isSelected: boolean;
  isLocked: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      aria-disabled={isLocked}
      disabled={isLocked}
      onClick={onSelect}
      className={cn(
        "flex w-full cursor-pointer flex-col rounded-xl px-3 py-2 text-left transition-colors hover:bg-surface-2",
        isSelected && "bg-surface-2",
        isLocked && "cursor-not-allowed opacity-50 hover:bg-transparent",
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-[13px] font-medium text-foreground">{item.name}</span>
        {isLocked && (
          <span className="inline-flex items-center gap-1 rounded bg-surface-3 px-1.5 py-0.5 text-[10px] font-semibold text-muted">
            <Lock className="size-2.5" />
            {requiredPlanFor(item.id)}
          </span>
        )}
        {item.badge && (
          <span className="inline-flex items-center gap-1 rounded bg-surface-3 px-1.5 py-0.5 text-[10px] text-muted">
            <Info className="size-2.5" />
            {item.badge}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-muted">{item.description}</span>
        <span className="ml-auto shrink-0 text-[10px] font-medium text-muted/80">{item.provider}</span>
      </div>
    </button>
  );
}
