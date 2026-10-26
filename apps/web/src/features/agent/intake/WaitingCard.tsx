import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AgentBlock } from "../transcript";

interface WaitingCardProps {
  icon: LucideIcon;
  narration: string;
  title: string;
  children?: ReactNode;
}

export function WaitingCard({ icon: Icon, narration, title, children }: WaitingCardProps) {
  return (
    <AgentBlock text={narration}>
      <div role="status" className="rounded-2xl border border-info/30 bg-surface-2 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <Icon aria-hidden="true" className="size-4 shrink-0 text-info" />
          <span className="min-w-0 flex-1 truncate text-[13px] text-foreground-secondary">{title}</span>
          <span className="shrink-0 rounded-full bg-info/15 px-2.5 py-0.5 text-[11px] font-medium text-info">Waiting for you</span>
        </div>
        {children}
      </div>
    </AgentBlock>
  );
}
