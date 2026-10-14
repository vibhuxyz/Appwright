import { useState } from "react";
import { LayoutGrid, List, Plus } from "lucide-react";
import type { Project } from "@/features/projects/schemas/projectSchemas";
import { ProjectGridCard } from "./ProjectGridCard";
import { cn } from "@/shared/lib/cn";

const SAMPLE_PROJECTS: Project[] = [
  { id: "ai-studio-sample", name: "ai-studio", templateId: "nextjs-fullstack", status: "READY", previewUrl: null, createdAt: new Date().toISOString() },
  { id: "ecommerce-sample", name: "ecommerce", templateId: "nextjs-fullstack", status: "BUILDING", previewUrl: null, createdAt: new Date().toISOString() },
  { id: "content-hub-sample", name: "content-hub", templateId: "nextjs-fullstack", status: "READY", previewUrl: null, createdAt: new Date().toISOString() },
  { id: "finance-dashboard-sample", name: "finance-dashboard", templateId: "vite-react", status: "READY", previewUrl: null, createdAt: new Date().toISOString() },
  { id: "mobile-app-sample", name: "mobile-app", templateId: "vite-react", status: "BUILDING", previewUrl: null, createdAt: new Date().toISOString() },
  { id: "marketing-site-sample", name: "marketing-site", templateId: "nextjs-fullstack", status: "READY", previewUrl: null, createdAt: new Date().toISOString() },
  { id: "internal-tools-sample", name: "internal-tools", templateId: "vite-react", status: "READY", previewUrl: null, createdAt: new Date().toISOString() },
];

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

  // Show user's projects, plus sample showcase projects to match design
  const allProjects = projects && projects.length > 0 ? projects : SAMPLE_PROJECTS;
  const filteredProjects = allProjects.filter((p) =>
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

        {/* View toggle switcher only (search box moved to top header) */}
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Create new project dashed card */}
        <button
          type="button"
          onClick={onOpenCreate}
          className="group flex min-h-55 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-surface/40 p-5 text-center transition-all hover:border-lime hover:bg-surface/80"
        >
          <div className="grid size-10 place-items-center rounded-xl bg-surface-2 text-foreground transition-all group-hover:bg-lime group-hover:text-black">
            <Plus className="size-5" />
          </div>
          <span className="mt-3 text-sm font-bold text-foreground group-hover:text-lime">
            Create new project
          </span>
          <span className="mt-0.5 text-xs text-muted">
            Start from scratch or a template
          </span>
        </button>

        {/* Filtered project cards */}
        {filteredProjects.map((project) => (
          <ProjectGridCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}
