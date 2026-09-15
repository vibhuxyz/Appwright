import { Square } from "lucide-react";
import type { StopNotice } from "../schemas/agentSchemas";
import {
  stopNoticeBannerClass,
  stopNoticeIcon,
  stopNoticeShortLabel,
} from "../utils/stopNoticePresentation";

export function RunStatusBar({
  running,
  statusDetail,
  activeStopNotice,
  userCredits,
  onStop,
  onResume,
  onAddCredits,
}: {
  running: boolean;
  statusDetail: string;
  activeStopNotice: StopNotice | null;
  userCredits: number;
  onStop: () => void;
  onResume: () => void;
  onAddCredits: () => void;
}) {
  if (running) {
    return (
      <div className="flex shrink-0 items-center justify-between border-b border-border-soft bg-surface-2 px-4 py-2 text-xs">
        <div className="flex min-w-0 items-center gap-2">
          <span className="relative flex size-2 shrink-0">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-lime opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-lime" />
          </span>
          <span className="truncate text-foreground">
            {statusDetail || "AI is working on your app…"}
          </span>
        </div>
        <button
          type="button"
          onClick={onStop}
          title="Stop AI run immediately"
          className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-[11px] text-foreground-secondary transition-colors hover:border-danger/50 hover:text-danger"
        >
          <Square className="size-3 fill-current" /> Stop
        </button>
      </div>
    );
  }

  if (activeStopNotice) {
    return (
      <div
        className={`flex shrink-0 items-center justify-between border-b px-4 py-1.5 text-xs ${stopNoticeBannerClass(activeStopNotice.reason)}`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0">{stopNoticeIcon(activeStopNotice.reason)}</span>
          <span className="truncate font-medium">
            {stopNoticeShortLabel(activeStopNotice, userCredits)}
          </span>
        </div>
        {activeStopNotice.reason === "outOfCredits" && userCredits <= 0 ? (
          <button
            type="button"
            onClick={onAddCredits}
            className="ml-2 shrink-0 cursor-pointer text-[11px] font-semibold underline"
          >
            Add credits
          </button>
        ) : (
          <button
            type="button"
            onClick={onResume}
            className="ml-2 shrink-0 cursor-pointer text-[11px] font-semibold underline"
          >
            Resume
          </button>
        )}
      </div>
    );
  }

  return null;
}
