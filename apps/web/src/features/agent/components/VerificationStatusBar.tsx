import { useState } from "react";
import { CheckCircle2, XCircle, ChevronDown, ChevronRight } from "lucide-react";
import type { VerificationResult } from "@repo/contracts";

interface VerificationStatusBarProps {
  results: VerificationResult[];
}

export function VerificationStatusBar({ results }: VerificationStatusBarProps) {
  const [expanded, setExpanded] = useState(false);
  const allPassed = results.every((r) => r.ok);
  const failedResults = results.filter((r) => !r.ok);

  return (
    <div className="my-2 rounded-lg border border-border-soft bg-surface-2 p-2 text-xs">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left font-medium"
      >
        <div className="flex items-center gap-2">
          {allPassed ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <XCircle className="h-4 w-4 text-rose-400" />
          )}
          <span className={allPassed ? "text-emerald-400" : "text-rose-400"}>
            {allPassed ? "TypeScript & build verified clean" : "Verification checks failed"}
          </span>
        </div>
        <div className="flex items-center gap-1 text-muted">
          <span>{results.map((r) => `${r.check}: ${r.ok ? "✓" : "✗"}`).join(" · ")}</span>
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </div>
      </button>

      {expanded && !allPassed && (
        <div className="mt-2 space-y-2 border-t border-border-soft pt-2 font-mono text-[11px]">
          {failedResults.map((res, i) => (
            <div key={i} className="space-y-1">
              <div className="font-semibold text-rose-400 uppercase">{res.check} errors:</div>
              {res.errors.map((err, j) => (
                <div key={j} className="text-foreground-secondary">
                  {err.file && (
                    <span className="text-cyan-400">
                      {err.file}:{err.line ?? 0}:{err.col ?? 0}{" "}
                    </span>
                  )}
                  <span>{err.message}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
