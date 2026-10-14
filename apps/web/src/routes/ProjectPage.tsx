import { useState } from "react";
import { useProject, useProjects } from "@/features/projects/hooks/useProjects";
import { ProjectWorkspace } from "@/features/workspace/components/ProjectWorkspace";
import { ProjectConsoleView } from "@/features/project-console/components/ProjectConsoleView";

export function ProjectPage({
  projectId,
  initialView,
}: {
  projectId: string;
  initialView?: "editor" | "console";
}) {
  const [internalView, setInternalView] = useState<"console" | "editor" | null>(null);
  const viewMode = internalView ?? (initialView === "console" ? "console" : "editor");

  const { data: singleProject } = useProject(projectId);
  const { data: projects } = useProjects();

  const currentProject = singleProject ?? projects?.find((p) => p.id === projectId);
  const projectName = currentProject?.name ?? projectId;

  if (viewMode === "editor") {
    return (
      <ProjectWorkspace
        projectId={projectId}
        onOpenConsole={() => setInternalView("console")}
      />
    );
  }

  return (
    <ProjectConsoleView
      projectName={projectName}
      project={currentProject}
      onOpenSandbox={() => setInternalView("editor")}
    />
  );
}
