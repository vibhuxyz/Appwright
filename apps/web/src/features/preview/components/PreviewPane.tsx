import { useEffect, useRef, useState } from "react";
import { isBrowserCheckStatus } from "@repo/contracts";
import type { Project } from "@/features/projects/schemas/projectSchemas";
import type { Session } from "@/features/agent/schemas/agentSchemas";
import { Panel } from "@/shared/components/ui/Panel";
import { useAgentStore } from "@/features/agent/store/agentStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useInspector } from "../hooks/useInspector";
import { useSessionPreview } from "../hooks/useSessionPreview";
import { badgeTextFor, previewErrorMessage, previewView } from "../lib/preview-view";
import { useSelectionStore } from "../store/selection-store";
import { PreviewAddressBar } from "./PreviewAddressBar";
import { PreviewCanvas } from "./PreviewCanvas";
import { PreviewPaneHeader } from "./PreviewPaneHeader";

const PREVIEW_LOAD_TIMEOUT_MS = 90_000;

interface PreviewPaneProps {
  project: Project | null | undefined;
  session?: Session | null;
}

export function PreviewPane({ project, session }: PreviewPaneProps) {
  const [reloadKey, setReloadKey] = useState(0);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const device = useWorkspaceStore((s) => s.previewDevice);
  const setDevice = useWorkspaceStore((s) => s.setPreviewDevice);
  const isEditMode = useSelectionStore((s) => s.isEditMode);
  const working = useAgentStore((s) => s.running);
  const statusDetail = useAgentStore((s) => s.statusDetail);
  const checking = isBrowserCheckStatus(statusDetail);
  const hasSessionPreview = Boolean(session?.previewUrl);
  const preview = useSessionPreview(session?.id, working || hasSessionPreview);
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const view = previewView({
    sessionUrl: preview.data?.previewUrl ?? session?.previewUrl ?? null,
    projectUrl: project?.previewUrl ?? null,
    hasSession: session !== null && session !== undefined,
    working,
    pending: preview.isPending,
    failed: preview.isError,
    reloadKey,
    loadedKey,
    failedKey,
  });

  useInspector(frameRef, view.currentKey);

  const reload = () => {
    setReloadKey((k) => k + 1);
    void preview.refetch();
  };

  useEffect(() => {
    if (!view.url || loadedKey === view.currentKey) return;
    const timer = setTimeout(() => setFailedKey(view.currentKey), PREVIEW_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [view.url, view.currentKey, loadedKey]);

  const badgeText = badgeTextFor({
    checking,
    running: view.isRunning,
    failed: view.isError,
    starting: view.isStarting,
  });

  return (
    <Panel className="flex-1">
      <PreviewPaneHeader
        url={view.url}
        working={working}
        running={view.isRunning}
        checking={checking}
        badgeText={badgeText}
        device={device}
        onDevice={setDevice}
      />
      <PreviewAddressBar url={checking ? statusDetail : view.url} onReload={reload} />
      <PreviewCanvas
        device={device}
        frameRef={frameRef}
        url={view.url}
        reloadKey={reloadKey}
        isEditMode={isEditMode}
        isError={view.isError}
        errorMessage={previewErrorMessage(preview.error)}
        isLoading={view.isLoading}
        loadStuck={view.loadStuck}
        isStarting={view.isStarting}
        checking={checking}
        sessionId={session?.id}
        statusDetail={statusDetail}
        onReload={reload}
        onLoad={() => setLoadedKey(view.currentKey)}
        onFail={() => setFailedKey(view.currentKey)}
      />
    </Panel>
  );
}
