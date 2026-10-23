import type { RefObject } from "react";
import { INSPECTOR_CURSOR_CSS } from "@repo/contracts";
import type { PreviewDevice } from "@/stores/workspaceStore";
import { cn } from "@/shared/lib/cn";
import { BrowserCheckView } from "./BrowserCheckView";
import { DeviceFrame } from "./DeviceFrame";
import { PreviewLoadingState } from "./PreviewLoadingState";

interface PreviewCanvasProps {
  device: PreviewDevice;
  frameRef: RefObject<HTMLIFrameElement | null>;
  url: string | null;
  reloadKey: number;
  isEditMode: boolean;
  isError: boolean;
  errorMessage: string;
  isLoading: boolean;
  loadStuck: boolean;
  isStarting: boolean;
  checking: boolean;
  sessionId?: string;
  statusDetail: string;
  onReload: () => void;
  onLoad: () => void;
  onFail: () => void;
}

export function PreviewCanvas(props: PreviewCanvasProps) {
  const { device, checking, sessionId, statusDetail } = props;
  return (
    <div className="relative min-h-0 flex-1 overflow-auto bg-background-deep p-0">
      <DeviceFrame device={device}>
        <PreviewCanvasBody {...props} />
      </DeviceFrame>
      {checking && sessionId ? <BrowserCheckView sessionId={sessionId} label={statusDetail} /> : null}
    </div>
  );
}

function PreviewCanvasBody(props: PreviewCanvasProps) {
  if (props.isError) {
    return <PreviewLoadingState title="Preview failed to start" subtitle={props.errorMessage} />;
  }
  if (props.url) return <PreviewFrame {...props} url={props.url} />;
  if (props.isStarting) {
    return (
      <PreviewLoadingState
        title="Waking up your project…"
        subtitle="Restoring workspace from git and starting development server. Cold boots take 30–90s."
      />
    );
  }
  return (
    <PreviewLoadingState
      title="Project is sleeping"
      subtitle="Opening a project reads from Postgres and git without booting a sandbox. Send a message to wake it up."
    />
  );
}

interface PreviewFrameProps {
  frameRef: RefObject<HTMLIFrameElement | null>;
  url: string;
  reloadKey: number;
  isEditMode: boolean;
  isLoading: boolean;
  loadStuck: boolean;
  onReload: () => void;
  onLoad: () => void;
  onFail: () => void;
}

function PreviewFrame({
  frameRef,
  url,
  reloadKey,
  isEditMode,
  isLoading,
  loadStuck,
  onReload,
  onLoad,
  onFail,
}: PreviewFrameProps) {
  const cursor = isEditMode ? { cursor: INSPECTOR_CURSOR_CSS } : undefined;
  return (
    <div className="relative size-full" style={cursor}>
      {isLoading ? <PreviewCover loadStuck={loadStuck} onReload={onReload} /> : null}
      <iframe
        ref={frameRef}
        key={reloadKey}
        title="preview"
        src={url}
        onLoad={onLoad}
        onError={onFail}
        style={cursor}
        className={cn(
          "size-full border-0 bg-transparent transition-opacity duration-300",
          isLoading ? "pointer-events-none opacity-0" : "opacity-100",
        )}
      />
    </div>
  );
}

function PreviewCover({ loadStuck, onReload }: { loadStuck: boolean; onReload: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background">
      {loadStuck ? (
        <PreviewLoadingState
          title="Preview is taking too long"
          subtitle="The dev server behind this preview didn't finish responding. Retry, or open it in a new tab."
          action={
            <button
              type="button"
              onClick={onReload}
              className="rounded-full border border-lime/30 bg-lime/10 px-3 py-1 text-[11px] font-medium text-lime transition-colors hover:bg-lime/20"
            >
              Retry
            </button>
          }
        />
      ) : (
        <PreviewLoadingState
          title="Rendering application…"
          subtitle="Rendering the session worktree via the preview proxy"
        />
      )}
    </div>
  );
}
