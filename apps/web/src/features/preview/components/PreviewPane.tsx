import { useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import type { Project } from "@/features/projects/schemas/projectSchemas";
import type { Session } from "@/features/agent/schemas/agentSchemas";
import { Panel, PanelHeader } from "@/shared/components/ui/Panel";
import { useAgentStore } from "@/features/agent/store/agentStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { cn } from "@/shared/lib/cn";
import { useInspector } from "../hooks/useInspector";
import { useSessionPreview } from "../hooks/useSessionPreview";
import { EditModeToggle } from "./EditModeToggle";
import { PreviewLoadingState } from "./PreviewLoadingState";
import { DeviceFrame } from "./DeviceFrame";
import { DeviceSwitcher } from "./DeviceSwitcher";
import { PreviewAddressBar } from "./PreviewAddressBar";

interface PreviewPaneProps {
  project: Project | null | undefined;
  session?: Session | null;
}

export function PreviewPane({ project, session }: PreviewPaneProps) {
  const [reloadKey, setReloadKey] = useState(0);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const device = useWorkspaceStore((s) => s.previewDevice);
  const setDevice = useWorkspaceStore((s) => s.setPreviewDevice);
  const working = useAgentStore((s) => s.running);
  const preview = useSessionPreview(session?.id, working);
  const frameRef = useRef<HTMLIFrameElement | null>(null);

  const url = working
    ? (preview.data?.previewUrl ?? session?.previewUrl ?? null)
    : (project?.previewUrl ?? null);
  const isStarting = working && preview.isPending && !url;
  const isError = working && preview.isError && !url;
  const isRunning = Boolean(url);
  const currentKey = `${url ?? ""}:${reloadKey}`;
  const isLoading = url ? loadedKey !== currentKey : isStarting;

  useInspector(frameRef, currentKey);

  const reload = () => {
    setReloadKey((k) => k + 1);
    void preview.refetch();
  };

  const badgeText = isRunning
    ? "Running"
    : isError
      ? "Error"
      : isStarting
        ? "Waking up…"
        : "Sleeping";

  return (
    <Panel className="flex-1">
      <PanelHeader
        title="Live Preview"
        badge={
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
              isRunning
                ? "border-success/30 bg-success/10 text-success"
                : "border-border-soft bg-surface-2 text-muted",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                isRunning ? "bg-success" : "animate-pulse bg-muted",
              )}
            />
            {badgeText}
          </span>
        }
        actions={
          <>
            <a
              href={url ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              title="Open preview in a new tab"
              aria-label="Open preview in a new tab"
              className={cn(
                "grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground",
                !url && "pointer-events-none opacity-40",
              )}
            >
              <ExternalLink className="size-4" />
            </a>
            <EditModeToggle disabled={!url || working} />
            <DeviceSwitcher device={device} onSelect={setDevice} />
          </>
        }
      />

      <PreviewAddressBar url={url} onReload={reload} />

      <div className="relative min-h-0 flex-1 overflow-auto bg-background-deep p-0">
        <DeviceFrame device={device}>
          {isError ? (
            <PreviewLoadingState
              title="Preview failed to start"
              subtitle={
                preview.error instanceof Error
                  ? preview.error.message
                  : "Could not start the session preview server."
              }
            />
          ) : url ? (
            <div className="relative size-full">
              {isLoading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-background">
                  <PreviewLoadingState
                    title="Rendering application…"
                    subtitle="Rendering the session worktree via the preview proxy"
                  />
                </div>
              )}
              <iframe
                ref={frameRef}
                key={reloadKey}
                title="preview"
                src={url}
                onLoad={() => setLoadedKey(currentKey)}
                className={cn(
                  "size-full border-0 bg-transparent transition-opacity duration-300",
                  isLoading ? "pointer-events-none opacity-0" : "opacity-100",
                )}
              />
            </div>
          ) : isStarting ? (
            <PreviewLoadingState
              title="Waking up your project…"
              subtitle="Restoring workspace from git and starting development server. Cold boots take 30–90s."
            />
          ) : (
            <PreviewLoadingState
              title="Project is sleeping"
              subtitle="Opening a project reads from Postgres and git without booting a sandbox. Send a message to wake it up."
            />
          )}
        </DeviceFrame>
      </div>
    </Panel>
  );
}
