import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  ChevronDown,
  Coins,
  Crown,
  Database,
  FileCode2,
  HardDrive,
  KeyRound,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Radio,
  ScrollText,
  Settings,
  Sparkles,
  Users,
  Webhook,
} from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useAuthStore } from "@/stores/authStore";
import { useProjects } from "@/features/projects/hooks/useProjects";
import { formatCreditsToDollars } from "@/features/billing/schemas/billingSchemas";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "auth", label: "Authentication", icon: Users },
  { id: "databases", label: "Databases", icon: Database },
  { id: "storage", label: "Storage", icon: HardDrive },
  { id: "functions", label: "Functions", icon: FileCode2 },
  { id: "messaging", label: "Messaging", icon: MessageSquare },
  { id: "realtime", label: "Realtime", icon: Radio },
  { id: "ai", label: "AI / Integrations", icon: Sparkles, badge: "New" },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

const DEVELOP_ITEMS = [
  { id: "api-keys", label: "API Keys", icon: KeyRound },
  { id: "webhooks", label: "Webhooks", icon: Webhook },
  { id: "logs", label: "Logs", icon: ScrollText },
  { id: "usage", label: "Usage", icon: Activity },
  { id: "team", label: "Team", icon: Users },
] as const;

export function ProjectConsoleSidebar({
  projectName,
  activeTab,
  onSelectTab,
  onOpenUpgrade,
  onOpenAddCredits,
}: {
  projectName: string;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenUpgrade?: () => void;
  onOpenAddCredits?: () => void;
}) {
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const plan = user?.plan ?? "FREE";
  const credits = user?.credits ?? 0;
  const { data: projects = [] } = useProjects();

  return (
    <aside className="relative flex h-screen w-60 shrink-0 flex-col border-r border-border/80 bg-[#0C0F16] text-muted select-none">
      {/* Brand header */}
      <div className="flex h-16 shrink-0 items-center border-b border-border/60 px-5">
        <Link to="/" className="flex items-center gap-2.5 text-foreground hover:opacity-90">
          <div className="grid size-7 place-items-center rounded-lg bg-lime font-mono text-xs font-black text-black">
            A
          </div>
          <span className="font-mono text-sm font-bold tracking-tight text-white">
            appwright
          </span>
        </Link>
      </div>

      {/* Project selector dropdown button */}
      <div className="relative border-b border-border/40 p-3">
        <button
          type="button"
          onClick={() => setIsProjectsOpen((prev) => !prev)}
          className="flex w-full items-center justify-between rounded-xl border border-border/70 bg-[#121622] p-2 text-left text-xs transition-colors hover:border-border hover:bg-[#181D2C]"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="grid size-6 shrink-0 place-items-center rounded-lg bg-lime/15 font-mono text-xs font-black text-lime">
              {projectName.charAt(0).toUpperCase()}
            </div>
            <span className="truncate font-semibold text-foreground">
              {projectName}
            </span>
          </div>
          <ChevronDown className="size-3.5 shrink-0 text-muted" />
        </button>

        {isProjectsOpen && (
          <div className="absolute top-full left-3 z-50 mt-1 w-54 rounded-xl border border-border bg-[#121622] p-1.5 shadow-xl">
            <div className="max-h-48 overflow-y-auto space-y-0.5">
              {projects.map((p) => (
                <Link
                  key={p.id}
                  to="/p/$projectId"
                  params={{ projectId: p.id }}
                  search={{ view: "console" }}
                  onClick={() => setIsProjectsOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-surface-2"
                >
                  <span className="truncate">{p.name}</span>
                </Link>
              ))}
            </div>
            <div className="mt-1 border-t border-border/60 pt-1">
              <Link
                to="/"
                onClick={() => setIsProjectsOpen(false)}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-lime hover:bg-surface-2"
              >
                <Plus className="size-3" />
                <span>All Projects / New</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Navigation list */}
      <div className="flex-1 space-y-5 overflow-y-auto p-3">
        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors",
                  isSelected
                    ? "bg-[#181D2C] text-white"
                    : "text-muted hover:bg-surface/60 hover:text-foreground",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={cn("size-4", isSelected ? "text-lime" : "text-muted")} />
                  <span>{item.label}</span>
                </div>
                {"badge" in item && (
                  <span className="rounded-md bg-sky-500/20 px-1.5 py-0.5 text-[9px] font-bold text-sky-400">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* DEVELOP section */}
        <div>
          <p className="px-3 text-[10px] font-bold tracking-wider text-muted/60 uppercase">
            Develop
          </p>
          <div className="mt-1 space-y-0.5">
            {DEVELOP_ITEMS.map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors",
                    isSelected
                      ? "bg-[#181D2C] text-white"
                      : "text-muted hover:bg-surface/60 hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 text-muted" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Real User Plan & Credits Card */}
      <div className="border-t border-border/60 p-3">
        <div className="rounded-2xl border border-border/80 bg-[#121622] p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Crown className="size-4 text-lime" />
              <span className="text-xs font-bold text-foreground">{plan} Plan</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
              <Coins className="size-3 text-amber-400" />
              <span>{formatCreditsToDollars(credits)}</span>
            </div>
          </div>
          <p className="mt-1.5 text-[10px] text-muted">Available AI balance</p>
          <button
            type="button"
            onClick={plan === "FREE" ? onOpenUpgrade : (onOpenAddCredits ?? onOpenUpgrade)}
            className="mt-3 w-full rounded-xl border border-border/90 bg-surface-2 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-surface-3"
          >
            {plan === "FREE" ? "Upgrade to Pro" : "+ Add Credits"}
          </button>
        </div>
      </div>
    </aside>
  );
}
