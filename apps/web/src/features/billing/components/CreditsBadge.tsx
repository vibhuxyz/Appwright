import { CREDITS_PER_USD } from "@repo/contracts";
import { Coins } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useCredits } from "../hooks/useAddCredits";
import { formatCreditsToDollars } from "../schemas/billingSchemas";

export function CreditsBadge({
  credits,
  onClick,
  className,
}: {
  credits: number;
  onClick?: () => void;
  className?: string;
}) {
  // Keeps the auth-store balance (this prop, and generation gating) on the
  // server value after a top-up or a failed attempt.
  useCredits();

  const tone =
    credits <= 0
      ? "border-danger/40 bg-danger/10 text-danger hover:bg-danger/20"
      : credits < CREDITS_PER_USD // Less than $1.00 balance
        ? "border-warning/40 bg-warning/10 text-warning hover:bg-warning/20"
        : "border-border-soft bg-surface text-foreground-secondary hover:border-border hover:bg-surface-2";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
        tone,
        className,
      )}
      title="Available dollar balance for AI generations. Click to add funds or upgrade."
    >
      <Coins className="size-3.5 text-amber-400 transition-transform group-hover:rotate-12" />
      <span className="font-mono font-semibold text-foreground">
        {formatCreditsToDollars(credits)}
      </span>
      <span className="hidden text-muted sm:inline">credits</span>
      <span className="ml-0.5 rounded-md px-1 py-0.5 text-[11px] font-bold text-lime hover:underline">
        + Add
      </span>
    </button>
  );
}
