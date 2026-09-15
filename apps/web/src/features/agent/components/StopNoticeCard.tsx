import type { StopNotice } from "../schemas/agentSchemas";
import { Button } from "@/shared/components/ui/Button";
import {
  stopNoticeCardClass,
  stopNoticeDescription,
  stopNoticeIcon,
  stopNoticeTitle,
} from "../utils/stopNoticePresentation";

export function StopNoticeCard({
  notice,
  userCredits,
  onResume,
  onAddCredits,
}: {
  notice: StopNotice;
  userCredits: number;
  onResume: () => void;
  onAddCredits: () => void;
}) {
  const canAddCredits = notice.reason === "outOfCredits" && userCredits <= 0;

  return (
    <div
      className={`mx-3 mb-1 flex shrink-0 items-center justify-between gap-3 rounded-2xl border p-3 text-xs ${stopNoticeCardClass(notice.reason)}`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="shrink-0 text-lg">{stopNoticeIcon(notice.reason)}</span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-semibold text-foreground">
            {stopNoticeTitle(notice)}
          </span>
          <span className="truncate text-[11px] text-muted">
            {stopNoticeDescription(notice, userCredits)}
          </span>
        </div>
      </div>
      {canAddCredits ? (
        <Button variant="premium" size="md" className="shrink-0" onClick={onAddCredits}>
          Add credits
        </Button>
      ) : (
        <Button variant="primary" size="md" className="shrink-0" onClick={onResume}>
          Continue building
        </Button>
      )}
    </div>
  );
}
