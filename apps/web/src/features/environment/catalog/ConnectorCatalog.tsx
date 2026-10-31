import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { IntegrationCatalogEntry, IntegrationEnvironment } from "@repo/contracts";
import { pendingPromptStore } from "@/features/agent/pending-prompt";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useIntegrationCatalog } from "../hooks";
import { ConnectorCard } from "./ConnectorCard";
import { filterIntegrationCatalog, type CatalogFilter } from "./filter-catalog";
import { integrationAgentPrompt } from "./integration-prompt";
import { IntegrationSetupDialog } from "./IntegrationSetupDialog";

const FILTERS: { id: CatalogFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "payments", label: "Payments" },
  { id: "login", label: "Login" },
  { id: "communications", label: "Communications" },
  { id: "storage", label: "Storage" },
  { id: "database", label: "Database" },
];

interface ConnectorCatalogProps {
  projectId: string;
  environment: IntegrationEnvironment;
  initialCategory?: CatalogFilter;
}

function startIntegration(entry: IntegrationCatalogEntry) {
  pendingPromptStore.getState().request(integrationAgentPrompt(entry));
  useWorkspaceStore.getState().setActiveTab("preview");
}

export function ConnectorCatalog({ projectId, environment, initialCategory = "all" }: ConnectorCatalogProps) {
  const [filter, setFilter] = useState<CatalogFilter>(initialCategory);
  const [searchText, setSearchText] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const { data, isLoading, error } = useIntegrationCatalog(projectId);
  const entries = useMemo(
    () => filterIntegrationCatalog(data?.catalog ?? [], filter, searchText),
    [data?.catalog, filter, searchText],
  );
  const selectedEntry = data?.catalog.find((entry) => entry.provider === selectedProvider);
  const selectedConfiguration = data?.configurations.find(
    (configuration) => configuration.provider === selectedProvider && configuration.environment === environment,
  );
  const selectedQuota = data?.quotas.find((quota) => quota.provider === selectedProvider);

  return (
    <section className="space-y-6" aria-labelledby="connectors-heading">
      <header>
        <h1 id="connectors-heading" className="text-2xl font-bold text-foreground">Connectors</h1>
        <p className="mt-1 text-sm text-muted">
          Integrate sends the agent to add this service. It will ask whether to use the Appwright test key or your own key, then build what the app needs.
        </p>
      </header>

      <label className="relative block max-w-xl">
        <Search aria-hidden="true" className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
        <span className="sr-only">Search integrations</span>
        <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search providers or capabilities" className="w-full rounded-xl border border-border bg-surface-2 py-2.5 pr-3 pl-10 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-lime" />
      </label>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Integration categories">
        {FILTERS.map((item) => (
          <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)} className={`rounded-full border px-3 py-1.5 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-lime ${filter === item.id ? "border-lime bg-lime/10 text-lime" : "border-border text-muted hover:text-foreground"}`}>
            {item.label}
          </button>
        ))}
      </div>

      {isLoading ? <p className="text-sm text-muted" role="status">Loading integrations…</p> : null}
      {error ? <p className="text-sm text-rose-400" role="alert">{error.message}</p> : null}
      {!isLoading && !error && entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted">No integrations match this search.</div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {entries.map((entry) => (
          <ConnectorCard
            key={entry.provider}
            entry={entry}
            configuration={data?.configurations.find(
              (item) => item.provider === entry.provider && item.environment === environment,
            )}
            onIntegrate={() => startIntegration(entry)}
            onConfigure={() => setSelectedProvider(entry.provider)}
          />
        ))}
      </div>

      {selectedEntry && (
        <IntegrationSetupDialog
          key={`${selectedEntry.provider}:${environment}`}
          projectId={projectId}
          entry={selectedEntry}
          environment={environment}
          configuration={selectedConfiguration}
          quota={selectedQuota}
          onClose={() => setSelectedProvider(null)}
        />
      )}
    </section>
  );
}
