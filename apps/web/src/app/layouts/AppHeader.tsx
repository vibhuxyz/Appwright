import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { CreditsBadge } from "@/features/billing/components/CreditsBadge";
import { UpgradeButton } from "@/features/billing/components/UpgradeButton";
import { AddCreditsModal } from "@/features/billing/components/AddCreditsModal";
import { UpgradeModal } from "@/features/billing/components/UpgradeModal";
import { SpecialOfferModal } from "@/features/billing/components/SpecialOfferModal";
import { SessionStats } from "@/features/workspace/components/SessionStats";
import { useBillingModalStore } from "@/features/billing/store/billingModalStore";
import type { Session } from "@/features/agent/schemas/agentSchemas";
import { ProfileMenu } from "./ProfileMenu";

function Wordmark() {
  return (
    <Link
      to="/"
      className="flex shrink-0 items-center gap-2 text-foreground transition-opacity hover:opacity-80"
    >
      <div className="grid size-7 place-items-center rounded-lg bg-lime font-mono text-xs font-black text-background">
        A
      </div>
      <span className="font-mono text-sm font-bold tracking-tight text-foreground">
        appwright
      </span>
    </Link>
  );
}

export function AppHeader({
  project,
  session,
  actions,
  searchQuery,
  onSearchChange,
  onNewProject,
  onAddCredits,
  onUpgrade,
}: {
  project?: ReactNode;
  session?: Session;
  actions?: ReactNode;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onNewProject?: () => void;
  onAddCredits?: () => void;
  onUpgrade?: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const updateCredits = useAuthStore((s) => s.updateCredits);
  const credits = user?.credits ?? 0;
  const isUpgraded = user != null && user.plan !== "FREE";

  const {
    isAddCreditsOpen,
    isUpgradeOpen,
    isSpecialOfferOpen,
    openAddCredits,
    closeAddCredits,
    openUpgrade,
    closeUpgrade,
    closeSpecialOffer,
  } = useBillingModalStore();

  const handleOpenAddCredits = () => {
    if (onAddCredits) {
      onAddCredits();
    } else {
      openAddCredits();
    }
  };

  const handleOpenUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      openUpgrade();
    }
  };

  return (
    <>
      <header className="relative flex h-16 shrink-0 items-center justify-between border-b border-border-soft bg-background px-4">
        {/* Left: Wordmark & optional project context */}
        <div className="flex items-center gap-3">
          <Wordmark />
          {!project && (
            <Link to="/sections" className="text-xs font-medium text-muted hover:text-foreground">
              Sections
            </Link>
          )}
          {project}
        </div>

        {/* Center: Search box dead-center in the middle */}
        {!project && (
          <div className="absolute left-1/2 hidden w-full max-w-sm -translate-x-1/2 items-center justify-between rounded-xl border border-border/80 bg-surface/90 px-3.5 py-2 text-xs text-muted shadow-xs transition-colors focus-within:border-border sm:flex md:max-w-md">
            <div className="flex flex-1 items-center gap-2.5">
              <Search className="size-4 shrink-0 text-muted" />
              <input
                type="text"
                value={searchQuery ?? ""}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="Search projects, templates, docs…"
                className="w-full bg-transparent text-xs text-foreground placeholder-muted outline-none"
              />
            </div>
            <kbd className="rounded border border-border/80 bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted">
              ⌘K
            </kbd>
          </div>
        )}

        {/* Right: Actions, Credits, Upgrade, Profile */}
        <div className="flex shrink-0 items-center gap-2.5 md:gap-3">
          {/* Session spend & token stats */}
          {session && <SessionStats session={session} />}

          {/* Credits balance badge with quick +Add */}
          <CreditsBadge credits={credits} onClick={handleOpenAddCredits} />

          {/* Upgrade button shown only when not upgraded */}
          {!isUpgraded && <UpgradeButton onClick={handleOpenUpgrade} />}

          {/* New Project CTA for dashboard */}
          {onNewProject && (
            <button
              type="button"
              onClick={onNewProject}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-lime px-3.5 py-2 text-xs font-bold text-black shadow-xs transition-all hover:bg-lime/90"
            >
              <Plus className="size-3.5 stroke-2" />
              <span>New Project</span>
            </button>
          )}

          {actions}

          <ProfileMenu onAddCredits={handleOpenAddCredits} />
        </div>
      </header>

      <AddCreditsModal
        isOpen={isAddCreditsOpen}
        currentCredits={credits}
        onClose={closeAddCredits}
        onSuccess={updateCredits}
        onOpenUpgrade={openUpgrade}
      />

      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={closeUpgrade}
        onOpenAddCredits={openAddCredits}
      />

      <SpecialOfferModal
        isOpen={isSpecialOfferOpen}
        onClose={closeSpecialOffer}
        onClaim={() => {
          updateCredits(credits + 50000);
          closeSpecialOffer();
        }}
      />
    </>
  );
}
