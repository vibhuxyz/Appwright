import type { ReactNode } from "react";
import { ChevronsUpDown, HelpCircle } from "lucide-react";

export function CollapsedDockBar({ onExpand, children }: { onExpand: () => void; children: ReactNode }) {
  return (
    <section aria-label="Agent questions, collapsed" className="shrink-0 border-t border-border-soft p-3">
      <div className="overflow-hidden rounded-2xl border border-info/25 bg-info/10">
        <div className="flex items-center justify-between px-4 py-2">
          <p className="flex items-center gap-2 text-sm font-medium text-info">
            <HelpCircle aria-hidden="true" className="size-4.5" />
            Agent has questions for you
          </p>
          <button
            type="button"
            onClick={onExpand}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-muted transition-colors hover:bg-surface-3 hover:text-foreground"
          >
            Expand
            <ChevronsUpDown aria-hidden="true" className="size-4" />
          </button>
        </div>
        <div className="mx-1.5 mb-1.5 *:last:border-t-0 *:last:p-0">{children}</div>
      </div>
    </section>
  );
}
