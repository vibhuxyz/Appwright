import { useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Code2,
  FileText,
  Globe,
  MoreHorizontal,
  Settings,
  ShoppingBag,
  Smartphone,
  Sparkles,
} from "lucide-react";
import type { Project } from "@/features/projects/schemas/projectSchemas";
import { useDeleteProject } from "@/features/projects/hooks/useProjects";
import { cn } from "@/shared/lib/cn";
import { ProjectCardLiveFrame } from "./ProjectCardLiveFrame";

const ICON_CONFIGS = [
  { match: ["ai", "studio"], Icon: Sparkles, bg: "bg-purple-600/20 text-purple-400 border-purple-500/30" },
  { match: ["ecom", "store"], Icon: ShoppingBag, bg: "bg-blue-600/20 text-blue-400 border-blue-500/30" },
  { match: ["content", "blog", "doc"], Icon: FileText, bg: "bg-rose-600/20 text-rose-400 border-rose-500/30" },
  { match: ["finance", "dash"], Icon: BarChart3, bg: "bg-emerald-600/20 text-emerald-400 border-emerald-500/30" },
  { match: ["mobile", "phone"], Icon: Smartphone, bg: "bg-sky-600/20 text-sky-400 border-sky-500/30" },
  { match: ["market", "site", "web"], Icon: Globe, bg: "bg-amber-600/20 text-amber-400 border-amber-500/30" },
  { match: ["tool", "internal"], Icon: Settings, bg: "bg-slate-600/20 text-slate-300 border-slate-500/30" },
];

function getProjectIcon(name: string) {
  const lower = name.toLowerCase();
  const found = ICON_CONFIGS.find((c) => c.match.some((m) => lower.includes(m)));
  return found ?? { Icon: Code2, bg: "bg-lime/10 text-lime border-lime/30" };
}

export function ProjectGridCard({ project }: { project: Project }) {
  const navigate = useNavigate();
  const deleteProject = useDeleteProject();
  const { Icon, bg } = getProjectIcon(project.name);

  const isProduction = project.status === "READY";
  const isDevelopment = project.status === "BUILDING" || project.status === "PROVISIONING";

  return (
    <div
      onClick={() =>
        navigate({
          to: "/p/$projectId",
          params: { projectId: project.id },
          search: { view: "console" },
        })
      }
      className="group relative flex cursor-pointer flex-col justify-between rounded-2xl border border-border/60 bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-xl hover:shadow-black/50"
    >
      <div>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("grid size-11 place-items-center rounded-xl border", bg)}><Icon className="size-5" /></div>
            <div>
              <h3 className="text-base font-semibold text-foreground group-hover:text-lime">{project.name}</h3>
              <p className="text-xs text-muted">Updated recently</p>
            </div>
          </div>

          <button
            type="button"
            title="Project options"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete project "${project.name}"?`)) {
                deleteProject.mutate(project.id);
              }
            }}
            className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-danger"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </div>

        {/* Live miniature preview frame */}
        <ProjectCardLiveFrame project={project} />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
        <span
          className={cn(
            "flex items-center gap-1.5 text-xs font-semibold",
            isProduction ? "text-emerald-400" : isDevelopment ? "text-amber-400" : "text-muted",
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              isProduction ? "bg-emerald-400" : isDevelopment ? "animate-pulse bg-amber-400" : "bg-muted",
            )}
          />
          {isProduction ? "Production" : isDevelopment ? "Building" : "Active"}
        </span>

        <span className="text-xs font-medium text-foreground-secondary group-hover:text-foreground">
          Console & Overview →
        </span>
      </div>
    </div>
  );
}
