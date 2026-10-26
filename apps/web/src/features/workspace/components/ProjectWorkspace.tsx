import { useAuthStore } from "@/stores/authStore";
import { useBillingModalStore } from "@/features/billing/store/billingModalStore";
import { useProject } from "@/features/projects/hooks/useProject";
import { useSession } from "@/features/agent/hooks/useSession";
import { useConversationStream } from "@/features/agent/hooks/useConversationStream";
import { useNewChat } from "@/features/agent/hooks/useNewChat";
import { ChatPane } from "@/features/agent/components/ChatPane";
import { PreviewPane } from "@/features/preview/components/PreviewPane";
import { PlanTab } from "@/features/plan";
import { AssetsPane } from "@/features/assets";
import { LogsPane } from "@/features/logs";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { SplitPane } from "@/shared/components/ui/SplitPane";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { ProjectHeader } from "./ProjectHeader";
import { WorkspaceTabs } from "./WorkspaceTabs";
import { FilesPane } from "./FilesPane";
import { EditorPane } from "./EditorPane";
import { DiffPane } from "./DiffPane";
import { CodeSubscriptionPaywall } from "./CodeSubscriptionPaywall";
import { DatabasePane } from "./DatabasePane";
import { PlaceholderPane } from "./PlaceholderPane";
import { useTouchedFiles } from "../hooks/useTouchedFiles";
import { ProjectEnvironmentView } from "@/features/environment";

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
  const newChat = useNewChat(projectId);

  useConversationStream(session?.id, session?.status, (usage) => {
    if (usage.creditsRemaining !== undefined) updateCredits(usage.creditsRemaining);
  });

  const touched = useTouchedFiles();
  const userCredits = user?.credits ?? 0;

  const rightPane = () => {
    switch (activeTab) {
      case "code":
        if (user?.plan === "FREE") {
          return <CodeSubscriptionPaywall onUpgrade={openUpgrade} />;
        }
        return (
          <div className="flex min-h-0 min-w-0 flex-1 gap-3">
            <FilesPane
              projectId={projectId}
              sessionId={session?.id}
              projectName={project?.name}
              touched={touched}
            />
            <EditorPane projectId={projectId} sessionId={session?.id} />
          </div>
        );
      case "preview":
        return <PreviewPane project={project} session={session} />;
      case "plan":
        return <PlanTab sessionId={session?.id} />;
      case "diff":
        return <DiffPane sessionId={session?.id ?? ""} />;
      case "assets":
        return <AssetsPane projectId={projectId} />;
      case "database":
        return <DatabasePane projectId={projectId} projectName={project?.name} templateId={project?.templateId} />;
      case "logs":
        return <LogsPane sessionId={session?.id} />;
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
      case "connectors":
        return <ProjectEnvironmentView projectId={projectId} projectName={project?.name ?? projectId} section="connectors" />;
      case "secrets":
        return <ProjectEnvironmentView projectId={projectId} projectName={project?.name ?? projectId} section="secrets" />;
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
        isNewChatBusy={newChat.isBusy}
        onNewChat={newChat.start}
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
                key={session?.id ?? "no-session"}
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
