import { useState } from "react";
import { LayoutGrid, List, Plus } from "lucide-react";
import type { Project } from "@/features/projects/schemas/projectSchemas";
import { DeleteProjectModal } from "@/features/projects/components/DeleteProjectModal";
import { ProjectGridCard } from "./ProjectGridCard";
import { cn } from "@/shared/lib/cn";

export function DashboardProjectsSection({
  projects,
  searchQuery = "",
  onOpenCreate,
}: {
  projects?: Project[];
  searchQuery?: string;
  onOpenCreate: () => void;
}) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const userProjects = projects ?? [];
  const filteredProjects = userProjects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Your projects
          </h2>
          <p className="mt-1 text-sm text-muted">
            All your projects in one place.
          </p>
        </div>

        <div className="flex items-center rounded-xl border border-border/80 bg-surface p-1">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={cn(
              "grid size-7.5 cursor-pointer place-items-center rounded-lg transition-colors",
              viewMode === "grid" ? "bg-surface-3 text-foreground" : "text-muted hover:text-foreground",
            )}
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={cn(
              "grid size-7.5 cursor-pointer place-items-center rounded-lg transition-colors",
              viewMode === "list" ? "bg-surface-3 text-foreground" : "text-muted hover:text-foreground",
            )}
          >
            <List className="size-4" />
          </button>
        </div>
      </div>

      <div
        className={cn(
          viewMode === "grid"
            ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            : "flex flex-col gap-3",
        )}
      >
        <button
          type="button"
          onClick={onOpenCreate}
          className={cn(
            "group flex cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-surface/40 p-5 text-center transition-all hover:border-lime hover:bg-surface/80",
            viewMode === "grid"
              ? "min-h-55 flex-col"
              : "min-h-20 flex-row gap-4 justify-start px-6",
          )}
        >
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-foreground transition-all group-hover:bg-lime group-hover:text-black">
            <Plus className="size-5" />
          </div>
          <div className={cn(viewMode === "list" && "text-left")}>
            <span className="block text-sm font-bold text-foreground group-hover:text-lime">
              Create new project
            </span>
            <span className="mt-0.5 block text-xs text-muted">
              Start from scratch or a template
            </span>
          </div>
        </button>

        {filteredProjects.map((project) => (
          <ProjectGridCard
            key={project.id}
            project={project}
            onDelete={setProjectToDelete}
          />
        ))}

        {userProjects.length === 0 && (
          <div
            className={cn(
              "flex items-center justify-center text-center",
              viewMode === "grid"
                ? "sm:col-span-1 lg:col-span-2 xl:col-span-3 min-h-55"
                : "py-6",
            )}
          >
            <p className="text-sm font-medium text-muted">No projects yet</p>
          </div>
        )}

        {userProjects.length > 0 && filteredProjects.length === 0 && searchQuery && (
          <div className="col-span-full py-10 text-center">
            <p className="text-sm text-muted">No projects found matching &ldquo;{searchQuery}&rdquo;</p>
          </div>
        )}
      </div>

      <DeleteProjectModal
        isOpen={projectToDelete !== null}
        project={projectToDelete}
        onClose={() => setProjectToDelete(null)}
      />
    </section>
  );
}
