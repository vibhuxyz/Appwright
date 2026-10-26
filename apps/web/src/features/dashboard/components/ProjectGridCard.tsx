import { useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Code2,
  FileText,
  Globe,
  Settings,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Trash2,
} from "lucide-react";
import { RuntimeEnvironmentBadge } from "@/features/projects/runtime-environment";
import type { Project } from "@/features/projects/schemas/projectSchemas";
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

export function ProjectGridCard({
  project,
  onDelete,
}: {
  project: Project;
  onDelete?: (project: Project) => void;
}) {
  const navigate = useNavigate();
  const { Icon, bg } = getProjectIcon(project.name);

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
            <div className={cn("grid size-11 place-items-center rounded-xl border", bg)}>
              <Icon className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground group-hover:text-lime">
                {project.name}
              </h3>
              <p className="text-xs text-muted">Updated recently</p>
            </div>
          </div>

          {onDelete && (
            <button
              type="button"
              title="Delete project"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(project);
              }}
              className="grid size-8 cursor-pointer place-items-center rounded-lg text-muted transition-colors hover:bg-rose-500/10 hover:text-rose-400"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>

        <ProjectCardLiveFrame project={project} />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
        <RuntimeEnvironmentBadge
          status={project.status}
          hasProductionDeployment={project.hasProductionDeployment}
        />

        <span className="text-xs font-medium text-foreground-secondary group-hover:text-foreground">
          Console & Overview →
        </span>
      </div>
    </div>
  );
}
