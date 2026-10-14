import { useState, useRef, useEffect } from "react";
import { LogOut, Crown, Coins, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

export function ProfileMenu({ onAddCredits }: { onAddCredits?: () => void }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const username = user?.email?.split("@")[0] ?? "account";
  const initial = username.charAt(0).toLowerCase();
  const plan = user?.plan ?? "free";
  const isPaid = plan !== "free";
  // MAX gets the same pink-for-premium treatment as its pricing card;
  // PRO keeps the lime "current plan" styling used everywhere else.
  const planBadgeClass =
    plan === "max"
      ? "border-pink/30 bg-pink/10 text-pink-light"
      : "border-lime/30 bg-lime/10 text-lime";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex cursor-pointer items-center gap-2 rounded-full border border-border-soft bg-surface py-1 pr-2.5 pl-1 text-xs transition-colors hover:border-border hover:bg-surface-2 focus:outline-none"
        aria-label="User menu"
      >
        <span className="grid size-6.5 shrink-0 place-items-center rounded-full bg-[#E3FC18] font-mono text-xs font-bold text-background shadow-xs">
          {initial}
        </span>
        <span className="max-w-28 truncate font-medium text-foreground sm:max-w-36">
          {username}
        </span>
        {isPaid && (
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${planBadgeClass}`}
          >
            <Crown className="size-2.5 fill-current" />
            <span>{plan}</span>
          </span>
        )}
        <ChevronDown className="size-3.5 shrink-0 text-muted" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-border-soft bg-surface p-2 shadow-xl">
          <div className="border-b border-border-soft px-3 py-2">
            <div className="flex items-center justify-between">
              <p className="truncate text-xs font-medium text-foreground">
                {username}
              </p>
              {isPaid ? (
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${planBadgeClass}`}
                >
                  <Crown className="size-2.5 fill-current" />
                  {plan} USER
                </span>
              ) : (
                <span className="inline-flex items-center rounded border border-border-soft bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted">
                  FREE
                </span>
              )}
            </div>
            <p className="truncate text-[11px] text-muted">
              {user?.email ?? ""}
            </p>
            <div className="mt-2 flex items-center justify-between rounded-md bg-surface-2 px-2 py-1 text-[11px]">
              <span className="text-muted">Credits balance:</span>
              <span className="font-mono font-semibold text-foreground">
                {(user?.credits ?? 0).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="py-1">
            {onAddCredits && (
              <button
                onClick={() => {
                  setOpen(false);
                  onAddCredits();
                }}
                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-foreground-secondary hover:bg-surface-2 hover:text-foreground"
              >
                <Coins className="size-3.5 text-amber-400" />
                <span>Add Credits</span>
              </button>
            )}
          </div>

          <div className="border-t border-border-soft pt-1">
            <button
              onClick={signOut}
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-danger hover:bg-danger/10"
            >
              <LogOut className="size-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
