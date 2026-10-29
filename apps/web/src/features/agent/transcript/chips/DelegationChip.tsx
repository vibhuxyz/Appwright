import { useState, type ReactNode } from "react";
import { Check, ChevronRight } from "lucide-react";

export function DelegationChip({
  agent,
  onView,
  children,
}: {
  agent: string;
  onView: (agent: string) => void;
  children?: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const canOpen = children !== undefined && children !== null;
  return (
    <div className="max-w-xl space-y-1.5">
      <button
        type="button"
        aria-expanded={canOpen ? isOpen : undefined}
        onClick={() => {
          if (canOpen) setIsOpen((open) => !open);
        }}
        className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-border-soft bg-surface-2 px-3 py-2 text-left"
      >
        <Check aria-hidden="true" className="size-3.5 shrink-0 text-success" />
        <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">Delegated to {agent}</span>
        {canOpen ? <ChevronRight aria-hidden="true" className={`size-3.5 shrink-0 text-muted ${isOpen ? "rotate-90" : ""}`} /> : <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 text-muted" />}
      </button>
      <button type="button" onClick={() => onView(agent)} className="px-1 text-[12px] text-foreground-secondary hover:text-foreground">
        ↳ View {agent} messages
      </button>
      {isOpen && canOpen ? <div className="rounded-lg border border-border-soft p-2">{children}</div> : null}
    </div>
  );
}
