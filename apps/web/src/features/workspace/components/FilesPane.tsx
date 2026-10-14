import { GripVertical, FolderTree } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { Panel, PanelHeader } from "@/shared/components/ui/Panel";
import { useFileTree } from "../hooks/useFileTree";
import { FileTree } from "./FileTree";

export function FilesPane({
  projectId,
  sessionId,
  touched,
}: {
  projectId: string;
  sessionId?: string;
  touched: Set<string>;
}) {
  const selected = useWorkspaceStore((s) => s.selectedFile);
  const selectFile = useWorkspaceStore((s) => s.selectFile);
  const { data: paths = [] } = useFileTree(projectId, touched.size, sessionId);

  return (
    <Panel className="w-[230px] shrink-0">
      <PanelHeader
        icon={<FolderTree className="size-[18px] text-foreground-secondary" />}
        title="Files"
        actions={<GripVertical className="size-4 text-muted" />}
      />
      <FileTree paths={paths} selected={selected} touched={touched} onSelect={selectFile} />
    </Panel>
  );
}
