import { lazy, Suspense } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { Panel } from "@/shared/components/ui/Panel";
import { useFileContent } from "../hooks/useFileContent";
import { EditorTabs } from "./EditorTabs";

// Monaco is ~2MB unminified — code-split it out of the main bundle so
// signing in and browsing projects never pays for it.
const CodeEditor = lazy(() =>
  import("./CodeEditor").then((m) => ({ default: m.CodeEditor })),
);

export function EditorPane({ projectId }: { projectId: string }) {
  const selected = useWorkspaceStore((s) => s.selectedFile);
  const openFiles = useWorkspaceStore((s) => s.openFiles);
  const selectFile = useWorkspaceStore((s) => s.selectFile);
  const closeFile = useWorkspaceStore((s) => s.closeFile);
  const { data: content = "" } = useFileContent(projectId, selected);

  return (
    <Panel className="flex-1">
      <EditorTabs
        openFiles={openFiles}
        selected={selected}
        onSelect={selectFile}
        onClose={closeFile}
      />
      <div className="min-h-0 flex-1">
        {selected ? (
          <Suspense
            fallback={<div className="p-4 text-[13px] text-muted">Loading editor…</div>}
          >
            <CodeEditor path={selected} content={content} />
          </Suspense>
        ) : (
          <div className="grid h-full place-items-center px-6 text-center text-[13px] text-muted">
            Pick a file from the tree to read it.
            <br />
            Edits happen through the agent, not here.
          </div>
        )}
      </div>
    </Panel>
  );
}
