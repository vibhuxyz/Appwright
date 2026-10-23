import { useState } from "react";
import { Check, Copy, Database, RefreshCw, Server, Table2, Layers } from "lucide-react";
import type { DatabaseOverviewResponse } from "../schemas/databaseSchemas";

export function DatabaseHeaderBanner({
  overview,
  isLoading,
  onRefresh,
}: {
  overview?: DatabaseOverviewResponse;
  isLoading?: boolean;
  onRefresh?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const status = overview?.status ?? "pending";
  const databaseName = overview?.databaseName ?? "Provisioning database…";

  const handleCopy = () => {
    if (!overview?.databaseName) return;
    navigator.clipboard.writeText(overview.databaseName);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusBadge = {
    ready: { text: "Connected", bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400" },
    provisioning: { text: "Provisioning", bg: "bg-amber-500/15 text-amber-400 border-amber-500/30", dot: "bg-amber-400 animate-pulse" },
    pending: { text: "Pending", bg: "bg-amber-500/15 text-amber-400 border-amber-500/30", dot: "bg-amber-400" },
    failed: { text: "Failed", bg: "bg-rose-500/15 text-rose-400 border-rose-500/30", dot: "bg-rose-400" },
    pending_delete: { text: "Pending Delete", bg: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30", dot: "bg-zinc-400" },
  }[status] ?? { text: status, bg: "bg-surface-3 text-muted border-border", dot: "bg-muted" };

  return (
    <div className="rounded-2xl border border-border/70 bg-[#121622]/90 p-5 shadow-xs">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-amber-500/30 bg-amber-500/15 text-amber-400">
            <Database className="size-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-mono text-base font-bold text-white sm:text-lg">
                {databaseName}
              </h2>
              {overview?.databaseName && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-md p-1 text-muted transition-colors hover:bg-surface hover:text-foreground"
                  aria-label="Copy database name"
                >
                  {copied ? <Check className="size-3.5 text-lime" /> : <Copy className="size-3.5" />}
                </button>
              )}
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusBadge.bg}`}>
                <span className={`size-1.5 rounded-full ${statusBadge.dot}`} />
                {statusBadge.text}
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted">
              <span className="flex items-center gap-1">
                <Server className="size-3 text-emerald-400" />
                MongoDB 7.0 Cluster
              </span>
              <span>•</span>
              <span className="capitalize">{overview?.environment ?? "development"} environment</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-surface/80 px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-surface-2 disabled:opacity-50"
            >
              <RefreshCw className={`size-3.5 text-muted ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border/50 pt-4">
        <div className="flex items-center gap-2.5 rounded-xl border border-border/40 bg-surface/40 p-3">
          <Table2 className="size-4 text-amber-400" />
          <div>
            <p className="text-[11px] text-muted">Collections</p>
            <p className="text-base font-black text-white">{overview?.collections.length ?? 0}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl border border-border/40 bg-surface/40 p-3">
          <Layers className="size-4 text-sky-400" />
          <div>
            <p className="text-[11px] text-muted">Total Documents</p>
            <p className="text-base font-black text-white">{overview?.totalDocuments ?? 0}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl border border-border/40 bg-surface/40 p-3">
          <Database className="size-4 text-purple-400" />
          <div>
            <p className="text-[11px] text-muted">Total Indexes</p>
            <p className="text-base font-black text-white">{overview?.totalIndexes ?? 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
