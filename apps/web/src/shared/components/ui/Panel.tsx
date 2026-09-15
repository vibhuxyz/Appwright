import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

/**
 * Every workspace surface is the same card: #1C1D1F on #0F1113 with a border
 * that almost disappears. Layering, not brightness, is what separates them.
 */
export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section
      className={cn(
        "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function PanelHeader({
  icon,
  title,
  badge,
  actions,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex h-13 shrink-0 items-center gap-2.5 border-b border-border-soft px-4",
        className,
      )}
    >
      {icon}
      <span className="truncate text-[15px] font-semibold text-foreground">{title}</span>
      {badge}
      {actions && <div className="ml-auto flex items-center gap-1.5">{actions}</div>}
    </header>
  );
}
