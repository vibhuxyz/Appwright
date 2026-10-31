import type {
  IntegrationCatalogEntry,
  IntegrationConfigurationResponse,
} from "@repo/contracts";
import { ConnectorIcon } from "./ConnectorIcon";

interface ConnectorCardProps {
  entry: IntegrationCatalogEntry;
  configuration?: IntegrationConfigurationResponse;
  onIntegrate: () => void;
  onConfigure: () => void;
}

function connectionStatus(configuration: IntegrationConfigurationResponse | undefined): {
  label: string;
  isConnected: boolean;
  isFailed: boolean;
} {
  const isConnected = configuration?.status === "connected" || configuration?.status === "verified";
  const isFailed = configuration?.status === "test_failed" || configuration?.status === "invalid";
  if (isConnected) return { label: "Connected", isConnected, isFailed };
  if (isFailed) return { label: "Test failed", isConnected, isFailed };
  if (configuration?.status === "quota_exhausted") return { label: "Quota exhausted", isConnected, isFailed };
  if (configuration?.status === "production_configuration_required") {
    return { label: "Production setup required", isConnected, isFailed };
  }
  if (configuration?.status === "configured") return { label: "Configuration saved", isConnected, isFailed };
  return { label: "Not connected", isConnected, isFailed };
}

export function ConnectorCard({ entry, configuration, onIntegrate, onConfigure }: ConnectorCardProps) {
  const status = connectionStatus(configuration);
  const badgeClass = status.isConnected
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
    : status.isFailed
      ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
      : "border-border text-muted";

  return (
    <article className="flex min-h-52 flex-col justify-between rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-muted">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-surface-2">
            <ConnectorIcon entry={entry} />
          </div>
          <span className={`rounded-full border px-2 py-1 text-[11px] ${badgeClass}`}>{status.label}</span>
        </div>
        <h2 className="mt-4 text-base font-semibold text-foreground">{entry.name}</h2>
        <p className="mt-1 text-sm text-muted">{entry.description}</p>
        <p className="mt-3 text-xs text-muted">{entry.capabilities.join(" · ")}</p>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onIntegrate}
          className="rounded-lg border border-lime bg-lime/10 px-3 py-2 text-xs font-semibold text-lime hover:bg-lime/20 focus-visible:outline-2 focus-visible:outline-lime"
        >
          Integrate
        </button>
        <button
          type="button"
          onClick={onConfigure}
          className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:border-lime focus-visible:outline-2 focus-visible:outline-lime"
        >
          {status.isConnected ? "Configure keys" : "Set keys"}
        </button>
      </div>
    </article>
  );
}
