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
};

/**
 * One surface at a time. "Code" and "Preview" are two values of the same
 * tab — they are never on screen together, which is what makes each of them
 * worth the full width of the pane. The strip scrolls sideways rather than
 * wrapping, so a narrow right pane still shows every option.
 */
export function WorkspaceTabs() {
  const activeTab = useWorkspaceStore((s) => s.activeTab);
  const setActiveTab = useWorkspaceStore((s) => s.setActiveTab);

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
            onClick={() => setActiveTab(tab)}
            className={cn(
              "shrink-0 cursor-pointer rounded-lg px-4 py-1.5 text-[13px] font-medium transition-colors",
              active
                ? "bg-surface-3 text-foreground"
                : "text-muted hover:text-foreground-secondary",
            )}
          >
            {LABEL[tab]}
          </button>
        );
      })}
    </div>
  );
}
