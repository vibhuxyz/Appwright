import { useState } from "react";
import { AppHeader } from "@/app/layouts/AppHeader";
import { DashboardView } from "@/features/dashboard/components/DashboardView";
import { CreateProjectModal } from "@/features/dashboard/components/CreateProjectModal";
import type { TemplateItem } from "@/features/dashboard/data/templatesData";

export function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);

  const handleOpenCreate = (template?: TemplateItem) => {
    setSelectedTemplate(template ?? null);
    setIsCreateOpen(true);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <AppHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNewProject={() => handleOpenCreate()}
      />
      <DashboardView
        searchQuery={searchQuery}
        onOpenCreate={handleOpenCreate}
      />
      <CreateProjectModal
        isOpen={isCreateOpen}
        initialTemplate={selectedTemplate}
        onClose={() => {
          setIsCreateOpen(false);
          setSelectedTemplate(null);
        }}
      />
    </div>
  );
}
