import { Database, FileCode2, HardDrive, MessageSquare } from "lucide-react";
import type {
  ProjectOverviewDatabase,
  ProjectOverviewMetrics,
} from "../schemas/projectConsoleSchemas";

interface ProjectConsoleMetricsProps {
  metrics?: ProjectOverviewMetrics;
  database?: ProjectOverviewDatabase | null;
  templateId?: string;
  isLoading?: boolean;
}

export function ProjectConsoleMetrics({
  metrics,
  database,
  templateId,
  isLoading,
}: ProjectConsoleMetricsProps) {
  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((id) => (
          <div
            key={id}
            className="flex h-32 animate-pulse flex-col justify-between rounded-2xl border border-border/70 bg-[#121622]/90 p-5 shadow-xs"
          >
            <div className="h-4 w-28 rounded-md bg-surface-3" />
            <div className="h-8 w-20 rounded-md bg-surface-3" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      id: "files",
      title: "Codebase Files",
      value: `${metrics.fileCount} Files`,
      subtext: `${templateId === "nextjs-fullstack" ? "Next.js Fullstack" : "Vite + React"} workspace`,
      status: "Ready in workspace",
      icon: FileCode2,
      iconStyle: "bg-purple-500/15 border-purple-500/30 text-purple-400",
    },
    {
      id: "sessions",
      title: "AI Agent Sessions",
      value: `${metrics.sessionCount} Sessions`,
      subtext: `${metrics.messageCount} messages · ${metrics.totalTokens.toLocaleString()} tokens`,
      status: metrics.sessionCount > 0 ? "Active sessions" : "No sessions yet",
      icon: MessageSquare,
      iconStyle: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
    },
    {
      id: "database",
      title: "Project Database",
      value: database?.status ?? (templateId === "vite-react" ? "Client Only" : "MongoDB"),
      subtext: database?.databaseName ?? (templateId === "vite-react" ? "Frontend application" : "Pending provisioning"),
      status: database?.status === "READY" ? "Connected" : (database?.status ?? "Not required"),
      icon: Database,
      iconStyle: "bg-amber-500/15 border-amber-500/30 text-amber-400",
    },
    {
      id: "assets",
      title: "Media Assets",
      value: `${metrics.assetCount} Assets`,
      subtext: "Cloudinary media storage",
      status: metrics.assetCount > 0 ? "Assets resolved" : "Library ready",
      icon: HardDrive,
      iconStyle: "bg-sky-500/15 border-sky-500/30 text-sky-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.id}
            className="flex flex-col justify-between rounded-2xl border border-border/70 bg-[#121622]/90 p-5 shadow-xs transition-colors hover:border-border"
          >
            <div className="flex items-center gap-3">
              <div className={`grid size-8 place-items-center rounded-xl border ${item.iconStyle}`}>
                <Icon className="size-4" />
              </div>
              <span className="text-xs font-semibold text-muted">{item.title}</span>
            </div>

            <div className="mt-4">
              <p className="text-2xl font-black text-white">{item.value}</p>
              <div className="mt-1 flex items-center justify-between text-[11px]">
                <span className="truncate text-muted">{item.subtext}</span>
                <span className="shrink-0 font-medium text-emerald-400">{item.status}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
