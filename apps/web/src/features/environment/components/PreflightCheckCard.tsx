import { AlertCircle, CheckCircle2, AlertTriangle, X } from "lucide-react";
import type { PreflightCheckResponse } from "@repo/contracts";

interface PreflightCheckCardProps {
  result: PreflightCheckResponse;
  onClose: () => void;
}

const CHECK_ICONS = {
  passed: <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />,
  failed: <AlertCircle className="size-4 shrink-0 text-rose-400" />,
  warning: <AlertTriangle className="size-4 shrink-0 text-amber-400" />,
  skipped: <span className="size-4 shrink-0 text-muted">—</span>,
};

export function PreflightCheckCard({ result, onClose }: PreflightCheckCardProps) {
  return (
    <div className={`rounded-2xl border p-5 ${
      result.ok
        ? "border-emerald-500/30 bg-emerald-950/20"
        : "border-rose-500/30 bg-rose-950/20"
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {result.ok ? (
            <CheckCircle2 className="size-5 text-emerald-400" />
          ) : (
            <AlertCircle className="size-5 text-rose-400" />
          )}
          <div>
            <h3 className="text-sm font-bold text-white">
              {result.ok
                ? `Preflight Passed for ${result.targetEnvironment}`
                : `Preflight Failed (${result.errors.length} issue${result.errors.length === 1 ? "" : "s"})`}
            </h3>
            <p className="text-xs text-muted">
              {result.ok
                ? "All required services, variables, and configurations are ready for execution."
                : "Resolve missing configuration before deploying to avoid runtime failure."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-muted hover:text-white"
        >
          <X className="size-4" />
        </button>
      </div>

      {result.errors.length > 0 && (
        <div className="mt-3 space-y-1">
          {result.errors.map((err, i) => (
            <p key={i} className="text-xs font-semibold text-rose-400">
              • {err}
            </p>
          ))}
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-2 border-t border-border/40 pt-3 md:grid-cols-2">
        {result.checks.map((chk, i) => (
          <div key={i} className="flex items-start gap-2 rounded-xl bg-surface/40 p-2 text-xs">
            {CHECK_ICONS[chk.status] ?? CHECK_ICONS.skipped}
            <div>
              <span className="font-mono font-semibold text-white">{chk.name}</span>
              <p className="text-[11px] text-muted">{chk.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
