import { useState } from "react";
import { usePendingPromptStore } from "@/features/agent/pending-prompt";
import { useProject, useProjects } from "@/features/projects/hooks/useProjects";
import { ProjectWorkspace } from "@/features/workspace";
import { ProjectConsoleView } from "@/features/project-console";

export function ProjectPage({
  projectId,
  initialView,
}: {
  projectId: string;
  initialView?: "editor" | "console";
}) {
  const [internalView, setInternalView] = useState<"console" | "editor" | null>(null);
  const pendingPrompt = usePendingPromptStore((state) => state.pending);
  if (pendingPrompt && internalView !== "editor") {
    setInternalView("editor");
  }
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
