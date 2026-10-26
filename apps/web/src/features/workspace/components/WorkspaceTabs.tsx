import { useAuthStore } from "@/stores/authStore";
import { useBillingModalStore } from "@/features/billing/store/billingModalStore";
import { WORKSPACE_TABS, useWorkspaceStore, type WorkspaceTab } from "@/stores/workspaceStore";
import { cn } from "@/shared/lib/cn";

const LABEL: Record<WorkspaceTab, string> = {
  code: "Code",
  preview: "Preview",
  plan: "Plan",
  diff: "Diff",
  assets: "Assets",
  database: "Database",
  logs: "Logs",
  analytics: "Analytics",
  settings: "Settings",
  connectors: "Connectors",
  secrets: "Secrets",
};

export function WorkspaceTabs() {
  const activeTab = useWorkspaceStore((s) => s.activeTab);
  const setActiveTab = useWorkspaceStore((s) => s.setActiveTab);
  const user = useAuthStore((s) => s.user);
  const openUpgrade = useBillingModalStore((s) => s.openUpgrade);
  const isFree = user?.plan === "FREE";

  const handleTabClick = (tab: WorkspaceTab) => {
    if (tab === "code" && isFree) {
      openUpgrade();
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div
      role="tablist"
      aria-label="Workspace view"
      className="flex shrink-0 scrollbar-none items-center gap-1 overflow-x-auto rounded-xl border border-border-soft bg-surface p-1 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      {WORKSPACE_TABS.map((tab) => {
        const active = tab === activeTab;
        return (
          <button
            key={tab}
            role="tab"
            aria-selected={active}
            onClick={() => handleTabClick(tab)}
            className={cn(
              "flex shrink-0 cursor-pointer items-center rounded-lg px-4 py-1.5 text-[13px] font-medium transition-colors",
              active
                ? "bg-surface-3 text-foreground"
                : "text-muted hover:text-foreground-secondary",
            )}
          >
            <span>{LABEL[tab]}</span>
            {tab === "code" && isFree && (
              <span className="ml-1.5 rounded-sm bg-[#E3FC18]/15 px-1 py-0.5 text-[10px] font-bold text-[#E3FC18]">
                PRO
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
