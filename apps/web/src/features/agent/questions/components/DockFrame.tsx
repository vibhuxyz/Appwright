import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { DockHeader } from "./DockHeader";

interface DockFrameProps {
  isTall?: boolean;
  onMinimize: () => void;
  footer: ReactNode;
  children: ReactNode;
}

export function DockFrame({ isTall = false, onMinimize, footer, children }: DockFrameProps) {
  return (
    <section aria-label="Agent questions" className="flex min-h-0 flex-col border-t border-border-soft p-3">
      <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-info/25 bg-info/10">
        <div className="shrink-0">
          <DockHeader onMinimize={onMinimize} />
        </div>
        <div className="mx-1.5 mb-1.5 flex min-h-0 flex-col rounded-xl border border-border-soft bg-surface-2">
          <div className={cn("min-h-0 space-y-3 overflow-y-auto p-4", isTall ? "max-h-[70vh]" : "max-h-[50vh]")}>{children}</div>
          <div className="shrink-0">{footer}</div>
        </div>
      </div>
    </section>
  );
}
