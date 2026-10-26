import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useProjects } from "../hooks/useProjects";
import type { Project } from "../schemas/projectSchemas";
import { CreateProjectForm } from "./CreateProjectForm";
import { ProjectCard } from "./ProjectCard";
import { ProjectListSkeleton } from "./ProjectListSkeleton";
import { EmptyProjects } from "./EmptyProjects";
import { ProjectListError } from "./ProjectListError";
import { DeleteProjectModal } from "./DeleteProjectModal";

export function ProjectList() {
  const { data: projects, isLoading, isError, refetch } = useProjects();
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const navigate = useNavigate();

  return (
    <div className="mb-8">
      <CreateProjectForm
        onCreated={(projectId) => {
          navigate({
            to: "/p/$projectId",
            params: { projectId },
            search: { view: "editor" },
          }).catch(() => {
            window.location.href = `/p/${projectId}?view=editor`;
          });
        }}
      />

      {isLoading && <ProjectListSkeleton />}
      {isError && <ProjectListError onRetry={refetch} />}
      {projects && (
        <div className="flex flex-col gap-2">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} onDelete={setProjectToDelete} />
          ))}
          {projects.length === 0 && <EmptyProjects />}
        </div>
      )}

      <DeleteProjectModal
        isOpen={projectToDelete !== null}
        project={projectToDelete}
        onClose={() => setProjectToDelete(null)}
      />
    </div>
  );
}
