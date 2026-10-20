import { Button } from "@/shared/components/ui/Button";
import type { ChangeRequestDecision } from "../schemas/plan-contract";

interface ChangeRequestNoticeProps {
  decision: ChangeRequestDecision;
  isConfirming: boolean;
  onConfirm: () => void;
}

export function ChangeRequestNotice({ decision, isConfirming, onConfirm }: ChangeRequestNoticeProps) {
  switch (decision.status) {
    case "rejected":
      return <p className="text-sm text-danger">Change rejected: {decision.reason}</p>;
    case "approved":
      return (
        <p className="text-sm text-foreground">
          Change approved. {decision.affectedTaskIds.length} task(s) will re-run.
        </p>
      );
    case "needs_confirmation":
      return (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
          <p className="flex-1 text-sm text-foreground">
            This changes the app stack (blueprint v{decision.blueprint.blueprintVersion}). Confirm
            before anything runs.
          </p>
          <Button size="sm" disabled={isConfirming} onClick={onConfirm}>
            {isConfirming ? "Confirming…" : "Confirm change"}
          </Button>
        </div>
      );
    default: {
      const unreachable: never = decision;
      return unreachable;
    }
  }
}
