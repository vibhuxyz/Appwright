import { useAuthStore } from "@/stores/authStore";
import { useBillingModalStore } from "@/features/billing/store/billingModalStore";
import { useProject } from "@/features/projects/hooks/useProject";
import { useSession } from "@/features/agent/hooks/useSession";
import { useConversationStream } from "@/features/agent/hooks/useConversationStream";
import { ChatPane } from "@/features/agent/components/ChatPane";
import { PreviewPane } from "@/features/preview/components/PreviewPane";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { SplitPane } from "@/shared/components/ui/SplitPane";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { ProjectHeader } from "./ProjectHeader";
import { WorkspaceTabs } from "./WorkspaceTabs";
import { FilesPane } from "./FilesPane";
import { EditorPane } from "./EditorPane";
import { DiffPane } from "./DiffPane";
import { PlaceholderPane } from "./PlaceholderPane";
import { useTouchedFiles } from "../hooks/useTouchedFiles";

export function ProjectWorkspace({
  projectId,
  onOpenConsole,
}: {
  projectId: string;
  onOpenConsole?: () => void;
}) {
  const { data: project } = useProject(projectId);
  const { data: session } = useSession(projectId);
  const user = useAuthStore((s) => s.user);
  const updateCredits = useAuthStore((s) => s.updateCredits);
  const activeTab = useWorkspaceStore((s) => s.activeTab);
  const openAddCredits = useBillingModalStore((s) => s.openAddCredits);
  const openUpgrade = useBillingModalStore((s) => s.openUpgrade);

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
            <FilesPane
              projectId={projectId}
              sessionId={session?.id}
              touched={touched}
            />
            <EditorPane projectId={projectId} sessionId={session?.id} />
          </div>
        );
      case "preview":
        return <PreviewPane project={project} session={session} />;
      case "diff":
        return <DiffPane sessionId={session?.id ?? ""} />;
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
        onAddCredits={openAddCredits}
        onUpgrade={openUpgrade}
        onOpenConsole={onOpenConsole}
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
                onAddCredits={openAddCredits}
              />
            </ErrorBoundary>
          }
          right={
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
              <WorkspaceTabs />
              {rightPane()}
            </div>
          }
        />
      </div>
    </div>
  );
}
