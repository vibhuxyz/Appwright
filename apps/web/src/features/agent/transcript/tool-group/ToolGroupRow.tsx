import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, Eye, FilePenLine, Loader2, SquareTerminal, Wrench } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import type { ToolGroupIcon, ToolGroupSummary } from "./summarize-tool-group";

const ICONS: Record<ToolGroupIcon, typeof Eye> = {
  view: Eye,
  edit: FilePenLine,
  command: SquareTerminal,
  other: Wrench,
};

export function ToolGroupRow({ summary, children }: { summary: ToolGroupSummary; children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = ICONS[summary.icon];
  return (
    <div className="rounded-xl border border-border-soft bg-surface-2">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left"
      >
        <Icon aria-hidden="true" className="size-4 shrink-0 text-muted" />
        <span className={cn("min-w-0 flex-1 truncate font-mono text-[12px]", summary.icon === "edit" ? "text-primary" : "text-foreground-secondary")}>
          {summary.label}
        </span>
        {summary.isRunning && <Loader2 aria-label="Running" className="size-3.5 shrink-0 animate-spin text-muted" />}
        {summary.hasFailure && <span aria-label="A step failed" className="size-2 shrink-0 rounded-full bg-danger" />}
        {isOpen ? <ChevronDown aria-hidden="true" className="size-3.5 shrink-0 text-muted" /> : <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 text-muted" />}
      </button>
      {isOpen && <div className="border-t border-border-soft p-2">{children}</div>}
    </div>
  );
}
