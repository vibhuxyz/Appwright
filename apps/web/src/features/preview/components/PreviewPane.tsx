import { useState } from "react";
import { ExternalLink, Monitor, RotateCw, Search, Smartphone, Tablet } from "lucide-react";
import type { Project } from "@/features/projects/schemas/projectSchemas";
import { Panel, PanelHeader } from "@/shared/components/ui/Panel";
import { useWorkspaceStore, type PreviewDevice } from "@/stores/workspaceStore";
import { cn } from "@/shared/lib/cn";

const DEVICES: { id: PreviewDevice; icon: typeof Monitor; label: string; width: string }[] = [
  { id: "desktop", icon: Monitor, label: "Desktop", width: "100%" },
  { id: "mobile", icon: Smartphone, label: "Mobile", width: "390px" },
  { id: "tablet", icon: Tablet, label: "Tablet", width: "820px" },
];

export function PreviewPane({ project }: { project: Project | null | undefined }) {
  const [reloadKey, setReloadKey] = useState(0);
  const device = useWorkspaceStore((s) => s.previewDevice);
  const setDevice = useWorkspaceStore((s) => s.setPreviewDevice);
  const url = project?.previewUrl ?? null;
  const running = !!url && project?.status === "READY";
  const width = DEVICES.find((d) => d.id === device)!.width;

  return (
    <Panel className="flex-1">
      <PanelHeader
        title="Live Preview"
        badge={
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
              running
                ? "border-success/30 bg-success/10 text-success"
                : "border-border-soft bg-surface-2 text-muted",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                running ? "bg-success" : "animate-pulse bg-muted",
              )}
            />
            {running ? "Running" : "Starting…"}
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
            <div className="ml-1 flex items-center gap-0.5 rounded-lg border border-border-soft bg-surface-2 p-0.5">
              {DEVICES.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  type="button"
                  title={label}
                  onClick={() => setDevice(id)}
                  className={cn(
                    "grid size-7 cursor-pointer place-items-center rounded-md transition-colors",
                    device === id
                      ? "bg-surface-3 text-foreground"
                      : "text-muted hover:text-foreground-secondary",
                  )}
                >
                  <Icon className="size-4" />
                </button>
              ))}
            </div>
          </>
        }
      />

      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="flex h-9 flex-1 items-center gap-2 rounded-lg border border-border-soft bg-surface-2 px-3">
          <Search className="size-3.5 shrink-0 text-muted" />
          <span className="truncate text-[13px] text-foreground-secondary">
            {url ?? "waiting for the dev server…"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          disabled={!url}
          title="Reload preview"
          className="grid size-9 cursor-pointer place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCw className="size-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-background-deep p-0">
        {url ? (
          <iframe
            key={reloadKey}
            title="preview"
            src={url}
            style={{ width }}
            className="mx-auto h-full border-0 bg-white"
          />
        ) : (
          <div className="grid h-full place-items-center text-center text-[13px] text-muted">
            The preview appears here once the sandbox dev server boots.
          </div>
        )}
      </div>
    </Panel>
  );
}
