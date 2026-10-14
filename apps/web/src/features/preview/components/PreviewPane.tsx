import { useState } from "react";
import { ExternalLink } from "lucide-react";
import type { Project } from "@/features/projects/schemas/projectSchemas";
import { Panel, PanelHeader } from "@/shared/components/ui/Panel";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { cn } from "@/shared/lib/cn";
import { PreviewLoadingState } from "./PreviewLoadingState";
import { DeviceFrame } from "./DeviceFrame";
import { DeviceSwitcher } from "./DeviceSwitcher";
import { PreviewAddressBar } from "./PreviewAddressBar";

interface PreviewPaneProps {
  project: Project | null | undefined;
  session?: { devPort?: number | null } | null;
}

export function PreviewPane({ project, session }: PreviewPaneProps) {
  const [reloadKey, setReloadKey] = useState(0);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const device = useWorkspaceStore((s) => s.previewDevice);
  const setDevice = useWorkspaceStore((s) => s.setPreviewDevice);

  const url = session?.devPort
    ? `http://localhost:${session.devPort}`
    : (project?.previewUrl ?? null);
  const isRunning = Boolean(url && project?.status === "READY");
  const currentKey = `${url ?? ""}:${reloadKey}`;
  const isLoading = url ? loadedKey !== currentKey : true;

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
            {isRunning ? "Running" : "Starting…"}
          </span>
        }
        actions={
          <>
            <a
              href={url ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              title="Open preview in a new tab"
              className={cn(
                "grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground",
                !url && "pointer-events-none opacity-40",
              )}
            >
              <ExternalLink className="size-4" />
            </a>
            <DeviceSwitcher device={device} onSelect={setDevice} />
          </>
        }
      />

      <PreviewAddressBar url={url} onReload={() => setReloadKey((k) => k + 1)} />

      <div className="relative min-h-0 flex-1 overflow-auto bg-background-deep p-0">
        <DeviceFrame device={device}>
          {url ? (
            <div className="relative size-full">
              {isLoading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-background">
                  <PreviewLoadingState
                    title="Your page is loading…"
                    subtitle="Rendering preview from your sandbox server"
                  />
                </div>
              )}
              <iframe
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
          ) : (
            <PreviewLoadingState
              title="Waiting for sandbox server…"
              subtitle="The live dev server is initializing. Your application preview will appear here automatically."
            />
          )}
        </DeviceFrame>
      </div>
    </Panel>
  );
}
