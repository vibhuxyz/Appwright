import type { MouseEvent } from "react";
import { ChevronRight } from "lucide-react";
import type { EffortLevel } from "@repo/contracts";
import { EFFORT_LABEL } from "./constants";

export function EffortRow({
  effort,
  onCycle,
}: {
  effort: EffortLevel;
  onCycle: (event: MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onCycle}
      aria-label={`Effort ${EFFORT_LABEL[effort]}`}
      className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors hover:bg-surface-2"
    >
      <span className="text-foreground">Effort</span>
      <div className="flex items-center gap-1 text-muted">
        <span>{EFFORT_LABEL[effort]}</span>
        <ChevronRight className="size-3.5" />
      </div>
    </button>
  );
}
