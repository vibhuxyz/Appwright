import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useProject } from "@/features/projects/hooks/useProject";
import { useSession } from "@/features/agent/hooks/useSession";
import { useConversationStream } from "@/features/agent/hooks/useConversationStream";
import { ChatPane } from "@/features/agent/components/ChatPane";
import { PreviewPane } from "@/features/preview/components/PreviewPane";
import { AddCreditsModal } from "@/features/billing/components/AddCreditsModal";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { SplitPane } from "@/shared/components/ui/SplitPane";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { ProjectHeader } from "./ProjectHeader";
import { WorkspaceTabs } from "./WorkspaceTabs";
import { FilesPane } from "./FilesPane";
import { EditorPane } from "./EditorPane";
import { PlaceholderPane } from "./PlaceholderPane";
import { useTouchedFiles } from "../hooks/useTouchedFiles";

export function ProjectWorkspace({ projectId }: { projectId: string }) {
  const { data: project } = useProject(projectId);
  const { data: session } = useSession(projectId);
  const user = useAuthStore((s) => s.user);
  const updateCredits = useAuthStore((s) => s.updateCredits);
  const activeTab = useWorkspaceStore((s) => s.activeTab);
  const [showAddCredits, setShowAddCredits] = useState(false);

  useConversationStream(session?.id, session?.status, (usage) => {
    if (usage.creditsRemaining !== undefined) updateCredits(usage.creditsRemaining);
  });

  const touched = useTouchedFiles();
  const userCredits = user?.credits ?? 0;

  // Code and Preview are mutually exclusive: only the chosen one is mounted,
  // so the preview iframe is not silently running behind the editor.
  const rightPane = () => {
    switch (activeTab) {
      case "code":
        return (
          <div className="flex min-h-0 min-w-0 flex-1 gap-3">
            <FilesPane projectId={projectId} touched={touched} />
            <EditorPane projectId={projectId} />
          </div>
        );
      case "preview":
        return <PreviewPane project={project} />;
      case "database":
        return (
          <PlaceholderPane
            title="Database"
            version="V4"
            description="Tables, rows and migrations for the generated app land with the full-stack template."
          />
        );
      case "logs":
        return (
          <PlaceholderPane
            title="Logs"
            version="V3"
            description="Sandbox build and dev-server output streams here once the cloud orchestrator owns the runtime."
          />
        );
      case "analytics":
        return (
          <PlaceholderPane
            title="Analytics"
            version="V6"
            description="Run counts, token spend and verify pass-rates arrive with observability."
          />
        );
      case "settings":
        return (
          <PlaceholderPane
            title="Settings"
            version="V2"
            description="Project name, template, environment variables and approval rules."
          />
        );
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background text-foreground">
      <ProjectHeader
        projectId={projectId}
        project={project}
        session={session}
        onAddCredits={() => setShowAddCredits(true)}
      />

      <div className="flex min-h-0 flex-1 p-4">
        <SplitPane
          storageKey="workspace"
          defaultRatio={0.3}
          minRatio={0.2}
          maxRatio={0.6}
          left={
            <ErrorBoundary>
              <ChatPane
                projectId={projectId}
                session={session}
                userCredits={userCredits}
                onAddCredits={() => setShowAddCredits(true)}
              />
            </ErrorBoundary>
          }
          right={
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <WorkspaceTabs />
              <ErrorBoundary>{rightPane()}</ErrorBoundary>
            </div>
          }
        />
      </div>

      <AddCreditsModal
        isOpen={showAddCredits}
        currentCredits={userCredits}
        onClose={() => setShowAddCredits(false)}
        onSuccess={(newCredits) => updateCredits(newCredits)}
      />
    </div>
  );
}
