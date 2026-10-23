import {
  Database,
  GitCommit,
  HardDrive,
  MessageSquare,
  Rocket,
  Sparkles,
} from "lucide-react";
import type { ProjectOverviewActivity } from "../schemas/projectConsoleSchemas";

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

function activityIcon(type: ProjectOverviewActivity["type"]) {
  switch (type) {
    case "project":
      return { icon: Sparkles, style: "bg-purple-500/15 text-purple-400" };
    case "database":
      return { icon: Database, style: "bg-amber-500/15 text-amber-400" };
    case "session":
      return { icon: MessageSquare, style: "bg-emerald-500/15 text-emerald-400" };
    case "asset":
      return { icon: HardDrive, style: "bg-sky-500/15 text-sky-400" };
    case "commit":
      return { icon: GitCommit, style: "bg-indigo-500/15 text-indigo-400" };
    case "deployment":
      return { icon: Rocket, style: "bg-pink-500/15 text-pink-400" };
  }
}

export function ProjectConsoleActivityList({
  recentActivity,
}: {
  recentActivity: ProjectOverviewActivity[];
}) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border/70 bg-[#121622]/90 p-5">
      <div>
        <h3 className="text-sm font-bold text-white">Project Activity</h3>
        <div className="mt-4 space-y-2.5">
          {recentActivity.length === 0 ? (
            <p className="text-xs text-muted">No activity recorded yet</p>
          ) : (
            recentActivity.slice(0, 4).map((item) => {
              const config = activityIcon(item.type);
              const Icon = config.icon;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-border/40 bg-surface/30 p-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className={`grid size-6 shrink-0 place-items-center rounded-lg ${config.style}`}>
                      <Icon className="size-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">{item.title}</p>
                      <p className="truncate text-[10px] text-muted">{item.desc}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted">{formatRelativeTime(item.timestamp)}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
