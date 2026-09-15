import { ProjectWorkspace } from "@/features/workspace/components/ProjectWorkspace";

// Route responsibility stops at reading the param — everything else is
// features/workspace's job.
export function ProjectPage({ projectId }: { projectId: string }) {
  return <ProjectWorkspace projectId={projectId} />;
}
