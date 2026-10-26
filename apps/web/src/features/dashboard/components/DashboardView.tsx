import { useState } from "react";
import { useProjects } from "@/features/projects/hooks/useProjects";
import type { TemplateItem } from "../data/templatesData";
import { DashboardHero } from "./DashboardHero";
import { TemplateShowcase } from "./TemplateShowcase";
import { DashboardProjectsSection } from "./DashboardProjectsSection";
import { CreateProjectModal } from "./CreateProjectModal";

export function DashboardView({
  searchQuery,
  onOpenCreate,
}: {
  searchQuery?: string;
  onOpenCreate?: (template?: TemplateItem) => void;
}) {
  const { data: projects } = useProjects();
  const [isInternalCreateOpen, setIsInternalCreateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);

  const handleSelectTemplate = (template: TemplateItem) => {
    if (onOpenCreate) {
      onOpenCreate(template);
    } else {
      setSelectedTemplate(template);
      setIsInternalCreateOpen(true);
    }
  };

  const handleOpenGeneralCreate = () => {
    if (onOpenCreate) {
      onOpenCreate();
    } else {
      setSelectedTemplate(null);
      setIsInternalCreateOpen(true);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-screen-2xl space-y-10 px-4 py-6 sm:p-8 lg:px-12">
        <DashboardHero />
        <DashboardProjectsSection
          projects={projects}
          searchQuery={searchQuery}
          onOpenCreate={handleOpenGeneralCreate}
        />
        <TemplateShowcase onSelectTemplate={handleSelectTemplate} />
      </div>

      {!onOpenCreate && (
        <CreateProjectModal
          key={`${isInternalCreateOpen}-${selectedTemplate?.id ?? "blank"}`}
          isOpen={isInternalCreateOpen}
          onClose={() => {
            setIsInternalCreateOpen(false);
            setSelectedTemplate(null);
          }}
        />
      )}
    </div>
  );
}
