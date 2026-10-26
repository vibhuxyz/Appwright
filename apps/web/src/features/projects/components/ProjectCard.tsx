import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { Project } from "../schemas/projectSchemas";
import { projectApi } from "../api/projectApi";
import { cn } from "@/shared/lib/cn";

const DOT: Record<Project["status"], string> = {
  READY: "bg-success",
  BUILDING: "bg-warning animate-pulse",
  PROVISIONING: "bg-blue-bright animate-pulse",
  ERROR: "bg-danger",
};

export function ProjectCard({
  project,
  onDelete,
}: {
  project: Project;
  onDelete?: (project: Project) => void;
}) {
  const queryClient = useQueryClient();

  return (
    <Link
      to="/p/$projectId"
      params={{ projectId: project.id }}
      onMouseEnter={() =>
        queryClient.prefetchQuery({
          queryKey: ["project", project.id],
          queryFn: () => projectApi.get(project.id),
        })
      }
      className="group flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3.5 transition-colors hover:bg-surface-2"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-3 text-sm font-semibold text-foreground">
        {project.name.charAt(0).toUpperCase()}
      </span>
      <span className="truncate text-[15px] text-foreground">{project.name}</span>
      <span className="ml-auto flex shrink-0 items-center gap-1.5 text-xs text-muted">
        <span className={cn("size-1.5 rounded-full", DOT[project.status])} />
        {project.status.toLowerCase()}
      </span>
      {onDelete && (
        <button
          type="button"
          className="shrink-0 cursor-pointer text-xs font-medium text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-rose-400"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(project);
          }}
        >
          Delete
        </button>
      )}
    </Link>
  );
}
