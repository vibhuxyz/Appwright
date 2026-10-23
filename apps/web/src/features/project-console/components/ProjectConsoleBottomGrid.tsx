import {
  ChevronRight,
  GitCommit,
  Globe,
} from "lucide-react";
import { CONSOLE_QUICK_ACTIONS } from "../data/consoleData";
import type {
  ProjectOverviewActivity,
  ProjectOverviewCommit,
} from "../schemas/projectConsoleSchemas";
import { ProjectConsoleActivityList } from "./ProjectConsoleActivityList";

function formatRelativeTime(dateString: string): string {
  const timestamp = new Date(dateString).getTime();
  if (Number.isNaN(timestamp)) return "recently";
  const diffSeconds = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSeconds < 60) return "just now";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

interface ProjectConsoleBottomGridProps {
  recentCommits?: ProjectOverviewCommit[];
  recentActivity?: ProjectOverviewActivity[];
  previewUrl?: string | null;
  onOpenSandbox: () => void;
  onOpenDeploy?: () => void;
  onOpenDatabase?: () => void;
}

export function ProjectConsoleBottomGrid({
  recentCommits = [],
  recentActivity = [],
  previewUrl,
  onOpenSandbox,
  onOpenDeploy,
  onOpenDatabase,
}: ProjectConsoleBottomGridProps) {
  const handleQuickAction = (action: string) => {
    if (action === "editor") onOpenSandbox();
    else if (action === "deploy" && onOpenDeploy) onOpenDeploy();
    else if (action === "database" && onOpenDatabase) onOpenDatabase();
    else if (action === "preview" && previewUrl) window.open(previewUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="flex flex-col justify-between rounded-2xl border border-border/70 bg-[#121622]/90 p-5">
        <div>
          <h3 className="text-sm font-bold text-white">Environments & Commits</h3>

          <div className="mt-4 space-y-2.5">
            <div className="flex items-center justify-between rounded-xl border border-border/40 bg-surface/30 p-2.5">
              <div className="flex items-center gap-2.5">
                <Globe className={`size-4 ${previewUrl ? "text-emerald-400" : "text-muted"}`} />
                <div>
                  <p className="text-xs font-semibold text-foreground">Local Dev Preview</p>
                  <p className="text-[10px] text-muted">{previewUrl ?? "Dev server idle"}</p>
                </div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${previewUrl ? "bg-emerald-500/15 text-emerald-400" : "bg-surface-3 text-muted"}`}>
                {previewUrl ? "Running" : "Idle"}
              </span>
            </div>

            {recentCommits.slice(0, 3).map((commit) => (
              <div
                key={commit.sha}
                className="flex items-center justify-between rounded-xl border border-border/40 bg-surface/30 p-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <GitCommit className="size-4 shrink-0 text-indigo-400" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground">{commit.message}</p>
                    <p className="text-[10px] text-muted">{formatRelativeTime(commit.date)}</p>
                  </div>
                </div>
                <span className="shrink-0 font-mono text-xs text-muted">{commit.shortSha}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ProjectConsoleActivityList recentActivity={recentActivity} />

      <div className="flex flex-col justify-between rounded-2xl border border-border/70 bg-[#121622]/90 p-5">
        <div>
          <h3 className="text-sm font-bold text-white">Quick Actions</h3>

          <div className="mt-4 space-y-2.5">
            {CONSOLE_QUICK_ACTIONS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleQuickAction(item.action)}
                  className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-border/40 bg-surface/30 p-2.5 text-left transition-colors hover:border-border/80 hover:bg-surface/70"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`grid size-6 place-items-center rounded-lg ${item.style}`}>
                      <Icon className="size-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{item.title}</p>
                      <p className="text-[10px] text-muted">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
