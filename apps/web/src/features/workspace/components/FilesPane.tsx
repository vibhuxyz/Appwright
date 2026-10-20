import { GripVertical, FolderTree } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { Panel, PanelHeader } from "@/shared/components/ui/Panel";
import { useFileTree } from "../hooks/useFileTree";
import { FileTree } from "./FileTree";

export function mergeFileTreePaths(
  diskPaths: readonly string[],
  touched: Iterable<string>,
): string[] {
  const paths = new Set(diskPaths);
  for (const relPath of touched) {
    if (relPath.length > 0) paths.add(relPath);
  }
  return [...paths];
}

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
  const { data: diskPaths = [], isPending, isError } = useFileTree(
    projectId,
    touched.size,
    sessionId,
  );
  const paths = mergeFileTreePaths(diskPaths, touched);

  return (
    <Panel className="w-[230px] shrink-0">
      <PanelHeader
        icon={<FolderTree className="size-[18px] text-foreground-secondary" />}
        title="Files"
        actions={<GripVertical className="size-4 text-muted" />}
      />
      {isError ? (
        <div className="p-4 text-[13px] text-muted">Couldn't load files.</div>
      ) : isPending && paths.length === 0 ? (
        <div className="p-4 text-[13px] text-muted">Loading files…</div>
      ) : (
        <FileTree
          paths={paths}
          selected={selected}
          touched={touched}
          onSelect={selectFile}
        />
      )}
    </Panel>
  );
}
