import { Bell, HelpCircle, Moon, Search } from "lucide-react";
import { ProfileMenu } from "@/app/layouts/ProfileMenu";

export function ProjectConsoleHeader({
  searchQuery,
  onSearchChange,
  onOpenAddCredits,
}: {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenAddCredits?: () => void;
}) {
  return (
    <header className="relative flex h-16 shrink-0 items-center justify-between border-b border-border/60 bg-[#0C0F16] px-6">
      {/* Left spacer for centering balance */}
      <div className="hidden w-24 sm:block" />

      {/* Dead-center Search Input */}
      <div className="absolute left-1/2 flex h-9.5 w-full max-w-xs -translate-x-1/2 items-center justify-between rounded-xl border border-border/80 bg-[#121622] px-3.5 text-xs text-muted shadow-xs transition-colors focus-within:border-border sm:max-w-md">
        <div className="flex flex-1 items-center gap-2">
          <Search className="size-3.5 shrink-0 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search anything…"
            className="w-full bg-transparent text-xs text-foreground placeholder-muted outline-none"
          />
        </div>
        <kbd className="shrink-0 rounded border border-border/60 bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted">
          ⌘K
        </kbd>
      </div>

      {/* Right Header Navigation & Profile */}
      <div className="flex items-center gap-3.5 text-xs font-medium text-muted">
        {/* Highlighted Support button */}
        <a
          href="mailto:support@appwright.dev"
          className="flex items-center gap-1.5 rounded-full border border-lime/30 bg-lime/10 px-3 py-1.5 text-xs font-semibold text-lime shadow-xs shadow-lime/15 transition-all hover:scale-105 hover:border-lime/60 hover:bg-lime/20 hover:text-white hover:shadow-lime/25"
        >
          <HelpCircle className="size-3.5 text-lime" />
          <span>Support</span>
        </a>

        {/* Theme toggle */}
        <button
          type="button"
          className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-foreground"
          aria-label="Theme toggle"
        >
          <Moon className="size-4" />
        </button>

        {/* Notifications bell */}
        <button
          type="button"
          className="relative grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-rose-500 ring-2 ring-[#0C0F16]" />
        </button>

        {/* Profile Menu without duplicate name */}
        <div className="border-l border-border/60 pl-2">
          <ProfileMenu onAddCredits={onOpenAddCredits} />
        </div>
      </div>
    </header>
  );
}
