import { AlertTriangle, CheckCircle } from "lucide-react";
import type { MergeResult } from "@/features/agent/schemas/agentSchemas";

interface MergeStatusBannerProps {
  result: MergeResult;
  onDismiss: () => void;
}

export function MergeStatusBanner({
  result,
  onDismiss,
}: MergeStatusBannerProps) {
  const isOk = result.ok;

  return (
    <div
      className={`flex flex-col gap-1.5 border-b px-4 py-2.5 text-xs font-medium ${
        isOk
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
          : "border-rose-500/20 bg-rose-500/10 text-rose-300"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isOk ? (
            <CheckCircle className="size-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="size-4 shrink-0 text-rose-400" />
          )}
          <span>{result.message}</span>
        </div>
        {!isOk && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-[11px] underline opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        )}
      </div>
      {result.conflicts && result.conflicts.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pl-6">
          <span className="text-[11px] text-muted">Conflicted files:</span>
          {result.conflicts.map((file) => (
            <span
              key={file}
              className="rounded border border-rose-500/30 bg-rose-500/20 px-1.5 py-0.5 font-mono text-[11px] text-rose-200"
            >
              {file}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
