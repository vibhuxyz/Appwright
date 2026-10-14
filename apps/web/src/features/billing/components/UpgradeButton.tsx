import { Crown } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export function UpgradeButton({
  onClick,
  className,
}: {
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-[#EAE8FD] px-3.5 py-1.5 text-xs font-semibold text-[#372883] transition-all hover:bg-[#DDD9FA] hover:shadow-xs active:scale-95 md:text-sm",
        className
      )}
      title="Upgrade to Pro"
    >
      <Crown className="size-4 shrink-0 text-[#372883]" strokeWidth={2.2} />
      <span>Upgrade</span>
    </button>
  );
}
