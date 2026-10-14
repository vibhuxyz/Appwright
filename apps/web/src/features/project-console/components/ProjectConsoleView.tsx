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

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0A0D14] text-foreground">
      {/* Sidebar */}
      <ProjectConsoleSidebar
        projectName={projectName}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenUpgrade={openUpgrade}
      />

      {/* Main content column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <ProjectConsoleHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenAddCredits={openAddCredits}
        />

        {/* Scrollable Project Space */}
        <div className="flex-1 overflow-y-auto">
          {/* Project Details Banner */}
          <ProjectConsoleProjectHeader
            projectName={projectName}
            project={project}
            onOpenSandbox={onOpenSandbox}
          />

          {/* Main Dashboard Overview Area */}
          <div className="space-y-6 px-8 py-6">
            {/* 4 Stat Cards */}
            <ProjectConsoleMetrics />

            {/* Middle 2 Columns: App Health & Live Preview */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ProjectConsoleHealth />
              <ProjectConsoleLivePreview
                projectName={projectName}
                project={project}
                onOpenSandbox={onOpenSandbox}
              />
            </div>

            {/* Bottom 3 Columns: Deployments, Activity, Quick Actions */}
            <ProjectConsoleBottomGrid />
          </div>
        </div>
      </div>

      {/* Billing & Upgrade Modals */}
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
