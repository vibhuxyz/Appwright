import type { RefObject } from "react";
import { Panel, PanelHeader } from "@/shared/components/ui/Panel";
import { BREAKPOINT_WIDTHS_PX } from "../lib/properties";
import { useDesignState } from "../store/design-state";

interface CanvasFrameProps {
  frameRef: RefObject<HTMLIFrameElement | null>;
  previewUrl: string | null;
}

export function CanvasFrame({ frameRef, previewUrl }: CanvasFrameProps) {
  const breakpoint = useDesignState((s) => s.breakpoint);

  return (
    <Panel className="min-w-0 flex-1">
      <PanelHeader title="Canvas" badge={<span className="text-[11px] text-muted">{BREAKPOINT_WIDTHS_PX[breakpoint]}px</span>} />
      <div className="flex min-h-0 flex-1 justify-center overflow-auto bg-surface-2">
        {previewUrl ? (
          <iframe
            ref={frameRef}
            src={previewUrl}
            title="Editable preview"
            style={{ width: BREAKPOINT_WIDTHS_PX[breakpoint] }}
            className="h-full max-w-full border-0 bg-white"
          />
        ) : (
          <p className="p-4 text-sm text-muted">The preview is not running yet.</p>
        )}
      </div>
    </Panel>
  );
}
