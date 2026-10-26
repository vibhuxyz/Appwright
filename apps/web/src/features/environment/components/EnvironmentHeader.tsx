import { RefreshCw, ShieldAlert } from "lucide-react";

interface EnvironmentHeaderProps {
  selectedEnv: "development" | "preview" | "production";
  onSelectEnv: (env: "development" | "preview" | "production") => void;
  isPreflightPending: boolean;
  isSyncPending: boolean;
  onRunPreflight: () => void;
  onSyncVercel: () => void;
  vercelConnected: boolean;
}

const ENV_TABS = [
  { id: "development", label: "Development" },
  { id: "preview", label: "Preview" },
  { id: "production", label: "Production" },
] as const;

export function EnvironmentHeader({
  selectedEnv,
  onSelectEnv,
  isPreflightPending,
  isSyncPending,
  onRunPreflight,
  onSyncVercel,
  vercelConnected,
}: EnvironmentHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-border/60 pb-6 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">Environment & Integrations</h1>
          <span className="rounded-full bg-lime/10 px-2.5 py-0.5 text-xs font-semibold text-lime">
            Managed Runtime
          </span>
        </div>
        <p className="mt-1 text-xs text-muted">
          Dependency-aware environment registry, secret management, and deployment preflight.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-border/80 bg-surface/40 p-1">
          {ENV_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectEnv(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedEnv === tab.id
                  ? "bg-lime text-black"
                  : "text-muted hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onRunPreflight}
          disabled={isPreflightPending}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-[#121622] px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-border hover:bg-[#181D2C] disabled:opacity-50"
        >
          {isPreflightPending ? (
            <RefreshCw className="size-3.5 animate-spin text-lime" />
          ) : (
            <ShieldAlert className="size-3.5 text-lime" />
          )}
          <span>Preflight Check</span>
        </button>

        {vercelConnected && (
          <button
            type="button"
            onClick={onSyncVercel}
            disabled={isSyncPending}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-[#121622] px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-border hover:bg-[#181D2C] disabled:opacity-50"
          >
            {isSyncPending ? (
              <RefreshCw className="size-3.5 animate-spin text-emerald-400" />
            ) : (
              <RefreshCw className="size-3.5 text-emerald-400" />
            )}
            <span>Sync to Vercel</span>
          </button>
        )}
      </div>
    </div>
  );
}
