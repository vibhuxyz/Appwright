import { useState, type ReactNode } from "react";
import { Check, ChevronRight, Eye, SquareTerminal } from "lucide-react";
import type { ActivityKind } from "./activity";

const ICONS = { file: Eye, shell: SquareTerminal, status: Check } as const;

export function ActivityChip({
  kind,
  label,
  path,
  children,
}: {
  kind: ActivityKind;
  label: string;
  path?: string;
  children?: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = ICONS[kind];
  const canOpen = children !== undefined && children !== null;
  return (
    <div className="max-w-xl">
      <button
        type="button"
        aria-expanded={canOpen ? isOpen : undefined}
        onClick={() => {
          if (canOpen) setIsOpen((open) => !open);
        }}
        className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-border-soft bg-surface-2 px-3 py-2 text-left"
      >
        <Icon aria-hidden="true" className="size-3.5 shrink-0 text-muted" />
        <span className={kind === "shell" ? "min-w-0 flex-1 truncate font-mono text-[12px] text-foreground-secondary" : "min-w-0 flex-1 truncate text-[13px] text-foreground-secondary"}>
          {label}
          {path ? <span className="text-primary"> {path}</span> : null}
        </span>
        {canOpen ? <ChevronRight aria-hidden="true" className={`size-3.5 shrink-0 text-muted ${isOpen ? "rotate-90" : ""}`} /> : null}
      </button>
      {isOpen && canOpen ? <div className="mt-1 rounded-lg border border-border-soft p-2">{children}</div> : null}
    </div>
  );
}
