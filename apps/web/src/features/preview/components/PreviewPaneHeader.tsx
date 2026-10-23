import { ExternalLink } from "lucide-react";
import type { PreviewDevice } from "@/stores/workspaceStore";
import { PanelHeader } from "@/shared/components/ui/Panel";
import { cn } from "@/shared/lib/cn";
import { DeviceSwitcher } from "./DeviceSwitcher";
import { EditModeToggle } from "./EditModeToggle";

interface PreviewPaneHeaderProps {
  url: string | null;
  working: boolean;
  running: boolean;
  checking: boolean;
  badgeText: string;
  device: PreviewDevice;
  onDevice: (device: PreviewDevice) => void;
}

export function PreviewPaneHeader({
  url,
  working,
  running,
  checking,
  badgeText,
  device,
  onDevice,
}: PreviewPaneHeaderProps) {
  const active = running || checking;
  return (
    <PanelHeader
      title="Live Preview"
      badge={<PreviewBadge active={active} text={badgeText} />}
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
          <DeviceSwitcher device={device} onSelect={onDevice} />
        </>
      }
    />
  );
}

function PreviewBadge({ active, text }: { active: boolean; text: string }) {
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        active
          ? "border-success/30 bg-success/10 text-success"
          : "border-border-soft bg-surface-2 text-muted",
      )}
    >
      <span className={cn("size-1.5 rounded-full", active ? "bg-success" : "animate-pulse bg-muted")} />
      {text}
    </span>
  );
}
