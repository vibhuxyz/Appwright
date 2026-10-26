import { useState } from "react";
import type { Project } from "@/features/projects/schemas/projectSchemas";
import { ProjectConsoleSidebar } from "./ProjectConsoleSidebar";
import { ProjectConsoleHeader } from "./ProjectConsoleHeader";
import { ProjectConsoleProjectHeader } from "./ProjectConsoleProjectHeader";
import { ProjectConsoleMetrics } from "./ProjectConsoleMetrics";
import { ProjectConsoleHealth } from "./ProjectConsoleHealth";
import { ProjectConsoleLivePreview } from "./ProjectConsoleLivePreview";
import { ProjectConsoleBottomGrid } from "./ProjectConsoleBottomGrid";
import { useBillingModalStore } from "@/features/billing/store/billingModalStore";
import { UpgradeModal } from "@/features/billing/components/UpgradeModal";
import { AddCreditsModal } from "@/features/billing/components/AddCreditsModal";
import { useAuthStore } from "@/stores/authStore";
import { useProjectConsoleOverview } from "../hooks/useProjectConsoleOverview";
import {
  useConnectVercel,
  useDeploy,
  useVercelStatus,
} from "@/features/deployments/hooks/useDeployment";
import { ProjectDatabaseView } from "@/features/database";
import { ProjectEnvironmentView } from "@/features/environment";

export function ProjectConsoleView({
  projectName,
  project,
  onOpenSandbox,
}: {
  projectName: string;
  project?: Project;
  onOpenSandbox: () => void;
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");

  const user = useAuthStore((s) => s.user);
  const credits = user?.credits ?? 0;
  const updateCredits = useAuthStore((s) => s.updateCredits);

  const {
    isAddCreditsOpen,
    isUpgradeOpen,
    openAddCredits,
    closeAddCredits,
    openUpgrade,
    closeUpgrade,
  } = useBillingModalStore();

  const { data: overview, isLoading } = useProjectConsoleOverview(project?.id);
  const { data: vercelStatus } = useVercelStatus();
  const connectVercel = useConnectVercel();
  const deploy = useDeploy(project?.id ?? "");

  const handleDeploy = () => {
    if (!project?.id) return;
    if (!vercelStatus?.connected) {
      connectVercel.mutate(project.id);
    } else {
      deploy.mutate();
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0A0D14] text-foreground">
      <ProjectConsoleSidebar
        projectName={projectName}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenUpgrade={openUpgrade}
        onOpenAddCredits={openAddCredits}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <ProjectConsoleHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenAddCredits={openAddCredits}
        />

        <div className="flex-1 overflow-y-auto">
          <ProjectConsoleProjectHeader
            projectName={projectName}
            project={project}
            onOpenSandbox={onOpenSandbox}
            onOpenDeploy={handleDeploy}
          />

          {activeTab === "overview" && (
            <div className="space-y-6 px-8 py-6">
              <ProjectConsoleMetrics
                metrics={overview?.metrics}
                database={overview?.database}
                templateId={project?.templateId}
                isLoading={isLoading}
              />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ProjectConsoleHealth
                  projectId={project?.id}
                  templateId={project?.templateId}
                  health={overview?.health}
                  database={overview?.database}
                  previewUrl={project?.previewUrl ?? overview?.previewUrl}
                  onOpenDatabase={() => setActiveTab("databases")}
                  onOpenEnvironment={() => setActiveTab("environment")}
                />
                <ProjectConsoleLivePreview
                  projectName={projectName}
                  project={project}
                  onOpenSandbox={onOpenSandbox}
                />
              </div>

              <ProjectConsoleBottomGrid
                recentCommits={overview?.recentCommits}
                recentActivity={overview?.recentActivity}
                previewUrl={project?.previewUrl ?? overview?.previewUrl}
                onOpenSandbox={onOpenSandbox}
                onOpenDeploy={handleDeploy}
                onOpenDatabase={() => setActiveTab("databases")}
              />
            </div>
          )}

          {activeTab === "databases" && (
            <div className="px-8 py-6">
              <ProjectDatabaseView
                projectId={project?.id}
                projectName={projectName}
                templateId={project?.templateId}
              />
            </div>
          )}

          {(activeTab === "connectors" ||
            activeTab === "payments" ||
            activeTab === "environment" ||
            activeTab === "auth" ||
            activeTab === "storage" ||
            activeTab === "messaging" ||
            activeTab === "realtime") && (
            <div className="px-8 py-6">
              <ProjectEnvironmentView
                projectId={project?.id}
                projectName={projectName}
                section={activeTab === "connectors"
                  ? "connectors"
                  : activeTab === "payments"
                    ? "payments"
                    : activeTab === "environment"
                      ? "secrets"
                      : "environment"}
              />
            </div>
          )}
        </div>
      </div>

      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={closeUpgrade}
        onOpenAddCredits={openAddCredits}
      />

      <AddCreditsModal
        isOpen={isAddCreditsOpen}
        currentCredits={credits}
        onClose={closeAddCredits}
        onSuccess={updateCredits}
        onOpenUpgrade={openUpgrade}
      />
    </div>
  );
}
