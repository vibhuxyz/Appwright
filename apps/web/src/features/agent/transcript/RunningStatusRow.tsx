import { Loader2, Square } from "lucide-react";
import { AGENT_WAIT_STATUS } from "@repo/contracts";

const IMAGE_WAIT_STATUS = "Waiting for section images…";
const TOOL_STATUS = /^Running (\w+)…$/;

function runningSubtitle(statusDetail: string): string {
  if (statusDetail === IMAGE_WAIT_STATUS) return "Pick an image for each section below to continue.";
  if (statusDetail === AGENT_WAIT_STATUS.answers) return "Answer the questions below to continue.";
  if (statusDetail === AGENT_WAIT_STATUS.keys) return "Choose how to connect each service below.";
  const toolMatch = TOOL_STATUS.exec(statusDetail);
  return toolMatch ? `Running ${toolMatch[1]}` : "Editing files, verifying TypeScript";
}

export function RunningStatusRow({ statusDetail, onStop }: { statusDetail: string; onStop: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border-soft bg-surface-2 px-3.5 py-3">
      <Loader2 aria-hidden="true" className="size-4 shrink-0 animate-spin text-lime" />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-[13px] text-foreground">{statusDetail || "Writing code…"}</span>
        <span className="truncate text-[11px] text-muted">{runningSubtitle(statusDetail)}</span>
      </div>
      <button
        type="button"
        onClick={onStop}
        title="Stop AI execution"
        className="ml-auto flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[11px] text-foreground-secondary transition-colors hover:border-danger/50 hover:text-danger"
      >
        <Square aria-hidden="true" className="size-3 fill-current" /> Stop
      </button>
    </div>
  );
}
