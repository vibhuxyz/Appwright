import { Link } from "@tanstack/react-router";
import {
  Activity,
  ChevronDown,
  Crown,
  Database,
  FileCode2,
  HardDrive,
  KeyRound,
  LayoutDashboard,
  MessageSquare,
  Radio,
  ScrollText,
  Settings,
  Sparkles,
  Users,
  Webhook,
} from "lucide-react";
import { cn } from "@/shared/lib/cn";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, active: true },
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
}: {
  projectName: string;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenUpgrade?: () => void;
}) {
  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border/80 bg-[#0C0F16] text-muted select-none">
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
      <div className="border-b border-border/40 p-3">
        <button
          type="button"
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

      {/* Bottom Pro Plan Card */}
      <div className="border-t border-border/60 p-3">
        <div className="rounded-2xl border border-border/80 bg-[#121622] p-3">
          <div className="flex items-center gap-2">
            <Crown className="size-4 text-lime" />
            <span className="text-xs font-bold text-foreground">Pro Plan</span>
          </div>
          <div className="mt-2.5">
            <div className="flex items-center justify-between text-[10px] text-muted">
              <span>12.5K / 100K requests</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
              <div className="h-full w-[15%] rounded-full bg-lime" />
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenUpgrade}
            className="mt-3 w-full rounded-xl border border-border/90 bg-surface-2 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-surface-3"
          >
            Upgrade
          </button>
        </div>
      </div>
    </aside>
  );
}
