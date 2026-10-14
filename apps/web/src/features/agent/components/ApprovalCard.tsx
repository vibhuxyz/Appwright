import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, ShieldCheck, Check, X } from "lucide-react";
import { agentApi } from "../api/agentApi";
import type { Approval } from "../schemas/agentSchemas";

interface ApprovalCardProps {
  approval: Approval;
  sessionId: string;
}

export function ApprovalCard({ approval, sessionId }: ApprovalCardProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      status,
      alwaysAllowTool,
    }: {
      status: "APPROVED" | "DENIED";
      alwaysAllowTool?: boolean;
    }) => agentApi.resolveApproval(approval.id, status, alwaysAllowTool),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  const isPending = mutation.isPending;
  const isResolved = approval.status !== "PENDING";

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm backdrop-blur-sm">
      <div className="flex items-center gap-2 font-medium text-amber-400">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        <span>Permission Required: {approval.toolName}</span>
      </div>

      <div className="mt-2.5 rounded-lg border border-border-soft bg-surface-2 p-2.5 font-mono text-xs text-foreground-secondary">
        <pre className="overflow-x-auto whitespace-pre-wrap">
          {JSON.stringify(approval.args, null, 2)}
        </pre>
      </div>

      {isResolved ? (
        <div className="mt-3 flex items-center gap-2 text-xs font-medium">
          <span className="text-muted">Status:</span>
          <span
            className={
              approval.status === "APPROVED"
                ? "text-emerald-400"
                : "text-rose-400"
            }
          >
            {approval.status}
          </span>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => mutation.mutate({ status: "APPROVED" })}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Approve</span>
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              mutation.mutate({ status: "APPROVED", alwaysAllowTool: true })
            }
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Always Allow in Session</span>
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => mutation.mutate({ status: "DENIED" })}
            className="flex items-center gap-1.5 rounded-lg border border-border-soft bg-surface-3 px-3 py-1.5 text-xs font-medium text-foreground-secondary transition hover:bg-surface-4 disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
            <span>Deny</span>
          </button>
        </div>
      )}
    </div>
  );
}
