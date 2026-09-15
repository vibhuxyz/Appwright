import { Coins } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export function CreditsBadge({ credits, onClick }: { credits: number; onClick: () => void }) {
  const tone =
    credits <= 0
      ? "border-danger/40 bg-danger/10 text-danger"
      : credits < 25_000
        ? "border-warning/40 bg-warning/10 text-warning"
        : "border-border-soft bg-surface text-foreground-secondary hover:bg-surface-3";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        tone,
      )}
      title="Available building credits (~3 apps initial). Click to add more."
    >
      <Coins className="size-3.5" />
      <span>{credits.toLocaleString()}</span>
      <span className="text-muted">credits</span>
      <span className="ml-0.5 font-semibold text-lime">+ Add</span>
    </button>
  );
}
