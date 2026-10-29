import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import type { QuestionCardModel, QuestionCardStatus } from "../types";

const SKIPPED_LINE = "Skipped, assuming defaults for now";
const STATUS_CHIP: Record<QuestionCardStatus, { label: string; className: string }> = {
  waiting: { label: "Waiting for you", className: "bg-info/15 text-info" },
  answered: { label: "Answered", className: "bg-surface-3 text-foreground-secondary" },
  skipped: { label: "Skipped", className: "bg-warning/15 text-warning" },
  cancelled: { label: "Cancelled", className: "bg-surface-3 text-muted" },
  failed: { label: "Failed", className: "bg-danger/15 text-danger" },
};

function QuestionList({ card }: { card: QuestionCardModel }) {
  return (
    <div className="m-3 space-y-3 rounded-xl bg-surface-3 px-4 py-3 text-[13px] leading-relaxed text-foreground-secondary">
      {card.intro && <p>{card.intro}</p>}
      <ol className="space-y-3">
        {card.items.map((item, index) => (
          <li key={`${index}-${item.label}`}>
            <p className="text-foreground">{index + 1}. {item.label} — {item.text}</p>
            {card.status === "skipped" ? (
              <p className="mt-1 italic">{SKIPPED_LINE}</p>
            ) : item.options.length > 0 ? (
              <p className="mt-1 font-medium text-foreground">{item.options.join("; ")}</p>
            ) : null}
          </li>
        ))}
      </ol>
      {card.moreCount > 0 && <p className="text-muted">(+{card.moreCount} more)</p>}
    </div>
  );
}

export function QuestionCard({ card }: { card: QuestionCardModel }) {
  const [isOpen, setIsOpen] = useState(false);
  const chip = STATUS_CHIP[card.status];
  return (
    <div className="rounded-2xl border border-border-soft bg-surface-2">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-left"
      >
        <HelpCircle aria-hidden="true" className="size-4 shrink-0 text-muted" />
        <span className="min-w-0 flex-1 truncate text-[13px] text-foreground-secondary">Agent asked a question</span>
        <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium", chip.className)}>{chip.label}</span>
        {isOpen ? <ChevronUp aria-hidden="true" className="size-4 shrink-0 text-muted" /> : <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted" />}
      </button>
      {isOpen && <QuestionList card={card} />}
    </div>
  );
}
