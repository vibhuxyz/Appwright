import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Coins, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

function Wordmark() {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2.5">
      <span className="grid size-8 place-items-center rounded-full bg-linear-to-br from-pink to-pink-light">
        <span className="size-3 rounded-full border-[2.5px] border-white" />
      </span>
      <span className="text-[19px] font-semibold tracking-tight text-foreground">appwright</span>
    </Link>
  );
}

function ProfileMenu({ onAddCredits }: { onAddCredits?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const [open, setOpen] = useState(false);
  const credits = user?.credits ?? 0;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex cursor-pointer items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors hover:bg-surface"
      >
        <span className="grid size-8 place-items-center rounded-full border border-border bg-surface-2 text-sm font-semibold text-foreground">
          {(user?.email ?? "?").charAt(0).toUpperCase()}
        </span>
        <span className="hidden text-sm text-foreground sm:block">
          {user?.email?.split("@")[0] ?? "Account"}
        </span>
        <ChevronDown className="size-4 text-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-60 rounded-xl border border-border bg-surface p-1.5 shadow-2xl shadow-black/60">
            <div className="truncate px-2.5 py-2 text-xs text-muted">{user?.email}</div>
            {/* Credits live here rather than in the bar — the header stays
                project · deploy · you, and nothing else. */}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onAddCredits?.();
              }}
              disabled={!onAddCredits}
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground-secondary transition-colors hover:bg-surface-3 hover:text-foreground disabled:cursor-default disabled:hover:bg-transparent"
            >
              <Coins className="size-4" />
              <span>{credits.toLocaleString()} credits</span>
              {onAddCredits && <span className="ml-auto text-xs font-semibold text-lime">+ Add</span>}
            </button>
            <button
              type="button"
              onClick={signOut}
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground-secondary transition-colors hover:bg-surface-3 hover:text-foreground"
            >
              <LogOut className="size-4" /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * The one and only header. Pages hand it whatever project context they have —
 * there is never a second bar underneath it.
 */
export function AppHeader({
  project,
  actions,
  onAddCredits,
}: {
  project?: ReactNode;
  actions?: ReactNode;
  onAddCredits?: () => void;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border-soft bg-background px-4">
      <Wordmark />
      {project}
      <div className="ml-auto flex shrink-0 items-center gap-3">
        {actions}
        <ProfileMenu onAddCredits={onAddCredits} />
      </div>
    </header>
  );
}
