import { Database } from "lucide-react";
import { ProjectDatabaseView } from "@/features/database";
import { Panel, PanelHeader } from "@/shared/components/ui/Panel";

export function DatabasePane({
  projectId,
  projectName,
  templateId,
}: {
  projectId: string;
  projectName: string | undefined;
  templateId: string | undefined;
}) {
  return (
    <Panel className="flex-1">
      <PanelHeader
        icon={<Database className="size-[18px] text-foreground-secondary" aria-hidden />}
        title="Database"
        badge={projectName && <span className="truncate text-xs text-muted">{projectName}</span>}
      />
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <ProjectDatabaseView projectId={projectId} projectName={projectName} templateId={templateId} />
      </div>
    </Panel>
  );
}
